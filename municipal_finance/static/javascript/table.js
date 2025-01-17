(function (exports) {
  // error reporting
  if ('addEventListener' in window) {
    window.addEventListener('error', (e) => {
      if (typeof ga === 'function') {
        ga('send', 'exception', {
          exDescription: `${e.message} @ ${e.filename}: ${e.lineno}`,
          exFatal: true,
        });
      }
    });
  }

  // polyfill for String.startsWith()
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    };
  }

  // progress indicators
  var spinning = 0;
  function spinnerStart() {
    spinning++;

    // this stops us showing a spinner for cached queries which
    // return very quickly
    _.delay(() => {
      if (spinning > 0) $('#spinner').show();
    }, 200);
  }

  function spinnerStop() {
    spinning--;
    if (spinning === 0) {
      $('#spinner').hide();
    }
  }

  var Filters = Backbone.Model.extend();
  var Cells = Backbone.Model.extend({
    defaults: {
      items: [],
    },
  });
  var State = Backbone.Model.extend({});

  // global municipalities list
  var municipalities;

  // default cube settings
  var cube = {
    drilldown: ['demarcation.code', 'demarcation.label', 'item.code', 'item.label'],
    model: CUBES[CUBE_NAME].model,
  };
  cube.hasAmountType = !!cube.model.dimensions.amount_type;
  cube.hasItems = !!cube.model.dimensions.item;
  cube.hasMonths = !!cube.model.dimensions.period_length && CUBE_NAME != 'incexp';
  cube.columns = _.map(cube.model.measures, (m) => `${m.ref}.sum`);

  // override defaults for specific cubes
  if (CUBE_NAME == 'audit_opinions') {
    cube.drilldown = ['demarcation.code', 'demarcation.label', 'opinion.label'];
    cube.columns = ['opinion.label'];
    cube.rowHeadingMeta = {
      code: 'financial_year_end.year',
      label: null,
    };
  } else if (CUBE_NAME == 'capital_v2') {
    cube.drilldown = ['demarcation.code', 'demarcation.label', 'capital_type.code', 'item.code', 'item.label'];
  }

  if (cube.hasItems) {
    // the cell elements used for row headings
    cube.rowHeadingMeta = {
      code: 'item.code',
      label: 'item.label',
      class: 'item.return_form_structure',
    };

    if (cube.model.dimensions.item.attributes.return_form_structure) cube.drilldown.push('item.return_form_structure');
    if (cube.model.dimensions.item.attributes.position_in_return_form) {
      cube.order = 'item.position_in_return_form:asc';
    } else {
      cube.order = 'item.code:asc';
    }
  }
  // do we have government functions?
  cube.hasFunctions = !!cube.model.dimensions.function;

  // ensure the cube can handle events
  _.extend(cube, Backbone.Events);

  /** The filters the user can choose
   */
  var FilterView = Backbone.View.extend({
    el: '.table-controls',
    events: {
      'click .del': 'muniRemoved',
      'click input[name=year]': 'yearChanged',
      'change select.amount-type-chooser': 'amountTypeChanged',
      'change select.month-chooser': 'monthChanged',
      'click #clear-munis': 'clearMunis',
    },

    initialize(opts) {
      this.filters = opts.filters;
      this.filters.on('change', this.render, this);
      this.filters.on('change', this.saveState, this);
      this.filters.on('change:municipalities', this.updateCubeLinks, this);

      cube.on('change', this.render, this);

      this.state = opts.state;
      this.state.on('change', this.loadState, this);

      $('#function-box').on('hide.bs.modal', _.bind(this.functionsChanged, this));
      $('#function-box').on('change', 'input:checkbox', _.bind(this.functionChecked, this));

      this.loadState();
      this.preload();
    },

    loadState() {
      // load state from browser history
      this.filters.set({
        municipalities: this.state.get('municipalities') || [],
        year: this.state.get('year'),
        month: this.state.get('month'),
        amountType: this.state.get('amountType'),
        functions: this.state.get('functions') || [],
      });
    },

    saveState() {
      // save global state to browser history
      this.state.set({
        municipalities: this.filters.get('municipalities'),
        year: this.filters.get('year'),
        month: this.filters.get('month'),
        amountType: this.filters.get('amountType'),
        functions: this.filters.get('functions'),
      });
    },

    preload() {
      this.preloadMunis();
      this.preloadAmountTypes();
      this.preloadFunctions();
    },

    preloadMunis() {
      var self = this;

      // preload municipalities
      spinnerStart();
      $.get(`${MUNI_DATA_API}/cubes/municipalities/facts`, (resp) => {
        var munis = _.map(resp.data, (muni) => {
          // change municipality.foo to foo
          _.each(_.keys(muni), (key) => {
            if (key.startsWith('municipality.')) {
              muni[key.substring(13)] = muni[key];
              delete muni[key];
            }
          });
          return muni;
        });

        // global municipalities list
        municipalities = _.indexBy(munis, 'demarcation_code');

        // sanity check pre-loaded municipalities
        self.filters.set('municipalities', _.select(self.filters.get('municipalities'), (id) => !!municipalities[id]), { silent: true });

        // force a change so we re-render
        self.filters.trigger('change');
      }).always(spinnerStop);
    },

    preloadAmountTypes() {
      var self = this;

      // TODO HACK
      self.years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009];

      self.renderYears();

      // sanity check pre-loaded year
      var year = self.filters.get('year');
      year = _.contains(self.years, year) ? year : self.years[0];
      self.filters.set('year', year, { silent: true });

      // sanity check pre-loaded month
      var month = self.filters.get('month');
      month = parseInt(month);
      if (isNaN(month) || month < 1 || month > 12) month = '';
      self.filters.set('month', month, { silent: true });

      // amount types per year
      // TODO HACK
      var amountTypes = [{ code: 'ACT', label: 'Actual' }, { code: 'ADJB', label: 'Adjusted Budget' }, { code: 'AUDA', label: 'Audited Actual' },
        { code: 'IBY1', label: 'Forecast 1 year ahead of budget year' },
        { code: 'IBY2', label: 'Forecast 2 years ahead of budget year' },
        { code: 'ORGB', label: 'Original Budget' }, { code: 'PAUD', label: 'Pre-audit' }];

      self.amountTypes = {};
      _.each(self.years, (year) => {
        self.amountTypes[year] = amountTypes;
      });

      // sanity check pre-loaded amount type
      var type = self.filters.get('amountType') || 'AUDA';
      if (!type || !_.any(self.amountTypes[year], (at) => at.code == type)) {
        type = self.amountTypes[year][0].code;
      }
      self.filters.set('amountType', type, { silent: true });

      $('.loading').hide();
      self.filters.trigger('change');
    },

    // government functions
    preloadFunctions() {
      if (!cube.hasFunctions) return;

      var self = this;

      // preload govt functions
      spinnerStart();
      $.get(`${MUNI_DATA_API}/cubes/${CUBE_NAME}/members/function?order=function.label`, (resp) => {
        cube.functions = _.map(resp.data, (func) => {
          // change municipality.foo to foo
          _.each(_.keys(func), (key) => {
            if (key.startsWith('function.')) {
              func[key.substring(9)] = func[key];
              delete func[key];
            }
          });
          return func;
        });

        cube.trigger('change');

        // sanity check pre-loaded functions
        self.filters.set('functions', _.select(self.filters.get('functions'), (code) => _.any(cube.functions, (func) => func.code == code)));
      }).always(spinnerStop);
    },

    updateCubeLinks() {
      var munis = this.filters.get('municipalities').join(',');
      if (munis) munis = `?municipalities=${munis}`;

      $('.cube-list a').each(function () {
        var $this = $(this);
        $this.attr('href', $this.attr('href').split('?')[0] + munis);
      });
    },

    render() {
      var $list = this.$('.chosen-munis').empty();
      var munis = this.filters.get('municipalities');
      var self = this;

      if (municipalities && !this.$muniChooser) {
        this.renderMunis();
      }

      // show chosen munis
      if (munis.length === 0) {
        $list.append('<li>').html('<i>Choose a municipality above.</i>');
        this.$('.clear-munis').hide();
      } else if (municipalities) {
        this.$('.clear-munis').show();

        _.each(munis, (muni) => {
          muni = municipalities[muni];
          $list.append($('<li>')
            .text(muni.long_name)
            .data('id', muni.demarcation_code)
            .prepend('<a href="#" class="del"><i class="fa fa-times-circle"></i></a> '));
        });
      }

      // ensure year is checked
      var year = (this.filters.get('year') || '').toString();
      this.$('.year-chooser input[name=year]').prop('checked', function () {
        return $(this).val() == year;
      });

      // ensure month is checked
      if (cube.hasMonths) {
        this.$('.month-chooser').val(this.filters.get('month'));
      }

      this.renderAmountTypes();
      this.renderFunctions();
    },

    renderMunis() {
      function formatMuni(item) {
        if (item.info) {
          return $(`<div>${item.info.name}, ${item.info.province_name} <i>${item.id}</i></div>`);
        } if (item.cat) {
          return $(`<div>${item.text} <i>Category ${item.cat}</i></div>`);
        }
        return $(`<div>${item.text}</div>`);
      }

      // make objects that select2 understands
      var munis = _.map(municipalities, (muni) => ({
        id: muni.demarcation_code,
        text: `${muni.long_name} ${muni.demarcation_code}`,
        info: muni,
      }));
      munis = _.sortBy(munis, 'text');

      // add the quick selections
      munis.unshift({
        id: 'all',
        text: 'All municipalities',
      }, {
        id: 'cat-A',
        text: 'All metro municipalities',
        cat: 'A',
      }, {
        id: 'cat-B',
        text: 'All local municipalities',
        cat: 'B',
      }, {
        id: 'cat-C',
        text: 'All district municipalities',
        cat: 'C',
      });

      this.$muniChooser = this.$('.muni-chooser').select2({
        data: munis,
        placeholder: 'Find a municipality',
        allowClear: true,
        templateResult: formatMuni,
      })
        .val(null)
        .trigger('change')
        .on('select2:select', _.bind(this.muniSelected, this));
    },

    renderAmountTypes() {
      var $chooser = this.$('.amount-type-chooser');
      var chosen = this.filters.get('amountType');
      var year = this.filters.get('year');

      if (!cube.hasAmountType) {
        this.$('section.amount-type').hide();
        return;
      }

      if (!_.isEmpty(this.amountTypes)) {
        $chooser.closest('section').show();
        $chooser.empty();

        for (var i = 0; i < this.amountTypes[year].length; i++) {
          var at = this.amountTypes[year][i];
          $chooser.append($('<option />').val(at.code).text(at.label));
        }
        $chooser.val(chosen);
      }
    },

    renderFunctions() {
      const hideFunctions = ['capital_facts_v2', 'incexp_facts_v2'];
      if (!cube.hasFunctions || hideFunctions.includes(cube.model.fact_table)) {
        this.$('section.function').hide();
        return;
      }

      if (_.isEmpty(cube.functions)) return;

      if ($('#function-box li').length === 0) {
        var $box = $('#function-box .options');
        var groups = _.groupBy(cube.functions, 'category_label');
        var $section;
        var count = 0;
        var groupSize = Math.ceil(cube.functions.length / 3);

        $box.append($('<div class="checkbox all"><label><input type="checkbox" value="all">Summarise all government functions</label></div>'));

        _.each(groups, (group, label) => {
          // group into columns of up to 20 items
          if (!$section || count > groupSize) {
            $section = $('<section>').appendTo($box);
            count = 0;
          }
          count += group.length;

          $section.append($('<h4>').text(label));
          var $ul = $('<ul>');
          _.each(group, (func) => {
            var $item = $(`<li class="checkbox"><label><input type="checkbox" value="${func.code}">${func.subcategory_label}</label></li>`);
            $ul.append($item);
          });
          $section.append($ul);
        });
      }

      var chosen = this.filters.get('functions');
      var text;

      // ensure they correct ones are selected
      $('#function-box input:checkbox').val(_.isEmpty(chosen) ? ['all'] : chosen);

      if (chosen.length === 0) {
        text = 'All government functions';
      } else if (chosen.length === 1) {
        var code = chosen[0];
        var func = _.find(cube.functions, (func) => func.code == code);
        if (func) text = func.label;
      }
      if (!text) text = `${chosen.length} government functions`;

      this.$('.function-chooser').text(`${text}...`);
    },

    renderYears() {
      var $chooser = this.$('.year-chooser');

      for (var i = 0; i < this.years.length; i++) {
        var year = this.years[i];
        $chooser.append($(`<li><label><input type="radio" name="year" value="${year}"> ${year}</label></li>`));
      }

      if (cube.hasMonths) {
        $('.table-controls .month').show();
      }
    },

    muniSelected(e) {
      var munis = this.filters.get('municipalities');
      var id = e.params.data.id;

      if (e.params.data.cat) {
        var chosen = _.select(municipalities, (m) => m.category == e.params.data.cat);
        chosen = _.pluck(chosen, 'demarcation_code');
        munis = _.uniq(munis.concat(chosen));
      } else if (id == 'all') {
        munis = _.keys(municipalities);
      } else if (id && _.indexOf(munis, id) === -1) {
        // duplicate the array
        munis = munis.concat([id]);
      }

      this.filters.set('municipalities', _.sortBy(munis, (m) => municipalities[m].name));
      this.filters.trigger('change');
      this.$muniChooser.val(null).trigger('change');
    },

    clearMunis(e) {
      e.preventDefault();
      this.filters.set('municipalities', []);
    },

    muniRemoved(e) {
      e.preventDefault();
      var id = $(e.target).closest('li').data('id');
      this.filters.set('municipalities', _.without(this.filters.get('municipalities'), id));
    },

    yearChanged(e) {
      var year = parseInt(this.$('input[name=year]:checked').val());
      this.filters.set('year', year);

      // sanity check amount type
      var at = this.filters.get('amountType');
      if (!_.isEmpty(this.amountTypes) && !_.any(this.amountTypes[year], (a) => a.code == at)) {
        this.filters.set('amountType', this.amountTypes[year][0].code);
      }
    },

    amountTypeChanged(e) {
      this.filters.set('amountType', $(e.target).val());
    },

    monthChanged(e) {
      this.filters.set('month', $(e.target).val());
    },

    functionsChanged(e) {
      var values = [];

      $('#function-box input[value!=all]:checked').each(function () {
        values.unshift($(this).val());
      });

      this.filters.set('functions', values);
    },

    functionChecked(e) {
      var $allBox = $('#function-box input[value=all]');

      if ($(e.target).val() == 'all') {
        $('#function-box input[value!=all]').prop('checked', false);
        $allBox.prop('disabled', true);
      } else {
        var chooseAll = $('#function-box input[value!=all]:checked').length === 0;
        $allBox
          .prop('checked', chooseAll)
          .prop('disabled', chooseAll);
      }
    },
  });

  /** The data table portion of the page.
   */
  var TableView = Backbone.View.extend({
    el: '#table-view',

    events: {
      'mouseover .table-display tr': 'rowOver',
      'mouseout .table-display tr': 'rowOut',
      'click .table-display tr': 'rowClick',
    },

    initialize(opts) {
      this.format = d3_format
        .formatLocale({
          decimal: '.', thousands: ' ', grouping: [3], currency: 'R',
        })
        .format(',d');
      this.firstRender = true;

      this.filters = opts.filters;
      this.filters.on('change', this.render, this);
      this.filters.on('change', this.update, this);

      this.state = opts.state;

      this.cells = opts.cells;
      this.cells.on('change', this.render, this);
      cube.on('change', this.render, this);

      this.preload();
    },

    preload() {
      if (!cube.hasItems) return;

      var self = this;

      spinnerStart();
      $.get(`${MUNI_DATA_API}/cubes/${CUBE_NAME}/members/item?order=${cube.order}`, (data) => {
        // we only care about items that have a label
        cube.rowHeadings = _.select(data.data, (d) => d[cube.rowHeadingMeta.label]);
        cube.rowHeadings = _.map(cube.rowHeadings, (h) => ({
          code: h[cube.rowHeadingMeta.code],
          label: h[cube.rowHeadingMeta.label],
          class: h[cube.rowHeadingMeta.class],
        }));
        cube.trigger('change');
      }).always(spinnerStop);
    },

    /**
     * Update the data!
     */
    update() {
      var self = this;
      var cells = [];
      var aggregating = !_.isEmpty(cube.model.measures);

      if (this.filters.get('municipalities').length === 0 || this.filters.get('year') === null) {
        this.cells.set({ items: [], meta: {} });
        return;
      }

      this.cells.set('items', cells);

      var parts = {
        drilldown: cube.drilldown,
        cut: [`financial_year_end.year:${this.filters.get('year')}`],
      };

      if (aggregating) parts.aggregates = cube.columns;
      if (cube.hasAmountType && this.filters.get('amountType')) {
        parts.cut.push(`amount_type.code:${this.filters.get('amountType')}`);
      }
      if (cube.model.dimensions.financial_period) {
        if (cube.hasMonths && this.filters.get('month')) {
          parts.cut.push(`financial_period.period:${this.filters.get('month')}`);
        } else {
          parts.cut.push(`financial_period.period:${this.filters.get('year')}`);
        }
      }
      if (!_.isEmpty(this.filters.get('functions'))) {
        parts.cut.push(`function.code:"${this.filters.get('functions').join('";"')}"`);
        parts.drilldown = ['function.code'].concat(parts.drilldown);
      }

      // duplicate this, we're going to change it
      var cut = parts.cut;
      parts.cut = cut.slice();
      parts.cut.push(`demarcation.code:"${this.filters.get('municipalities').join('";"')}"`);
      // TODO: paginate

      spinnerStart();
      $.get(self.makeUrl(parts), (data) => {
        if (data.total_cell_count > 0) {
          self.downloadUrl = self.makeDownloadUrl(parts, aggregating ? data.total_cell_count : data.total_fact_count);
          self.cells.set('items', self.cells.get('items').concat(aggregating ? data.cells : data.data));
          $('#downloadBtn').attr('disabled', false);
        } else {
          $('#downloadBtn').attr('disabled', true);
        }
      })
        .always(spinnerStop)
        .fail(() => {
          alert('An error occurred.\nPlease try a different selection or try again later.');
        });
    },

    makeDownloadUrl(parts, pagesize) {
      // establish download url
      var params = _.clone(parts);
      var hasFunctions = !_.isEmpty(this.filters.get('functions'));
      _.extend(params, {
        page: 1,
        pagesize,
        order: 'demarcation.code:asc',
      });

      if (cube.order) params.order += `,${cube.order}`;

      // copy this, we're going to change it
      params.drilldown = params.drilldown.slice();

      // ensure the download has all relevant attributes.
      // we only include government functions if we're already filtering by them
      _.each(cube.model.dimensions, (dim, dim_name) => {
        if (dim_name != 'function' || hasFunctions) {
          _.each(dim.attributes, (attr, attr_name) => {
            params.drilldown.unshift(`${dim_name}.${attr_name}`);
          });
        }
      });

      return this.makeUrl(params);
    },

    makeUrl(parts) {
      var url = `${MUNI_DATA_API}/cubes/${CUBE_NAME}/${parts.aggregates ? 'aggregate' : 'facts'}?`;
      return url + _.map(parts, (value, key) => {
        if (_.isArray(value)) value = value.join('|');
        return `${key}=${encodeURIComponent(value)}`;
      }).join('&');
    },

    render() {
      if (!cube.hasItems) {
        // use year labels as items
        cube.rowHeadings = [{ code: this.filters.get('year'), label: null }];
      }

      if (cube.rowHeadings || !cube.hasItems) {
        this.renderRowHeadings();

        if (municipalities) {
          if (CUBE_NAME == 'capital_v2') {
            var columns = [];
            $.ajax({
              url: `${MUNI_DATA_API}/cubes/${CUBE_NAME}/members/capital_type`,
              async: false,
              success(resp) {
                resp.data.forEach((capitalType) => {
                  if (capitalType['capital_type.code']) {
                    columns.push({ code: capitalType['capital_type.code'], label: capitalType['capital_type.label'] });
                  }
                });
                self.aggregate_columns = { ...columns };
              },
            });
          }

          this.renderColHeadings();
          this.renderValues(self.aggregate_columns);
        }
      }

      this.renderDownloadLinks();
    },

    renderRowHeadings() {
      // render row headings table
      var table = this.$('.row-headings').empty()[0];
      var blanks = 1;

      if (cube.columns.length > 1) blanks++;
      if (!_.isEmpty(this.filters.get('functions'))) blanks++;
      if (CUBE_NAME == 'capital_v2') blanks++;

      for (var i = 0; i < blanks; i++) {
        var spacer = $('<th>').html('&nbsp;').addClass('spacer');
        table.insertRow().appendChild(spacer[0]);
      }

      for (i = 0; i < (cube.rowHeadings || []).length; i++) {
        var heading = cube.rowHeadings[i];
        var tr = table.insertRow();
        var td;

        $(tr).addClass(`item-${heading.class}`);

        td = tr.insertCell();
        td.innerText = heading.code;
        if (heading.label) {
          td = tr.insertCell();
          td.innerText = heading.label;
          td.setAttribute('title', heading.label);
        }
      }
    },

    renderColHeadings() {
      var table = this.$('.values').empty()[0];
      var functions = this.functionHeadings();

      var muniColumns = 1;
      var valueColumns;
      if (CUBE_NAME == 'capital_v2') {
        muniColumns = Object.keys(self.aggregate_columns).length;
        valueColumns = self.aggregate_columns;
      } else if (cube.columns.length > 1) {
        muniColumns = cube.columns.length;
        valueColumns = cube.model.measures;
      }

      // municipality headings
      var tr = table.insertRow();
      var munis = this.filters.get('municipalities');
      for (var i = 0; i < munis.length; i++) {
        var muni = municipalities[munis[i]];
        var th = document.createElement('th');
        th.innerText = muni.name;
        th.setAttribute('colspan', muniColumns * Math.max(functions.length, 1));
        th.setAttribute('title', muni.demarcation_code);
        tr.appendChild(th);
      }

      // function headings
      if (cube.hasFunctions && !_.isEmpty(functions)) {
        tr = table.insertRow();
        _.times(munis.length, () => {
          _.each(functions, (func) => {
            var th = document.createElement('th');
            th.innerText = func.label;
            th.setAttribute('colspan', cube.columns.length);
            tr.appendChild(th);
          });
        });
      }

      // column (aggregate) headings
      if (CUBE_NAME == 'capital_v2' || cube.columns.length > 1) {
        tr = table.insertRow();
        _.times(munis.length, () => {
          _.each(valueColumns, (columns) => {
            var th = document.createElement('th');
            th.innerText = columns.label;
            tr.appendChild(th);
          });
        });
      }
    },

    renderValues(aggregate_columns) {
      var table = this.$('.values')[0];
      var cells = this.cells.get('items');
      var munis = this.filters.get('municipalities');
      var functions = this.functionHeadings();

      // highlightable items as a set of codes
      var highlights = _.inject(this.state.get('items') || [], (s, i) => { s[i] = i; return s; }, {});
      // row indexes to highlight
      var toHighlight = [];
      var self = this;

      // group cells by item code then municipality
      cells = _.groupBy(cells, cube.rowHeadingMeta.code);
      _.each(cells, (items, code) => {
        cells[code] = _.groupBy(items, 'demarcation.code');

        // group by function?
        if (functions.length > 0) {
          _.each(cells[code], (items, muni) => {
            cells[code][muni] = _.indexBy(items, 'function.code');
          });
        }
      });

      // values
      if (!_.isEmpty(cells)) {
        for (var i = 0; i < cube.rowHeadings.length; i++) {
          var heading = cube.rowHeadings[i];
          var tr = table.insertRow();
          $(tr).addClass(`item-${heading.class}`);

          // highlight?
          if (highlights[heading.code]) toHighlight.push(table.rows.length - 1);

          // each muni
          for (var j = 0; j < munis.length; j++) {
            var muni = municipalities[munis[j]];
            var muni_data = cells[heading.code];
            if (muni_data) muni_data = muni_data[muni.demarcation_code];

            if (functions.length > 0) {
              for (var f = 0; f < functions.length; f++) {
                var data = muni_data ? muni_data[functions[f].code] : null;
                this.renderMuniValues(muni, data, tr);
              }
            } else if (CUBE_NAME == 'capital_v2') {
              var data = [];
              if (muni_data) {
                Object.keys(aggregate_columns).forEach((column) => {
                  var row = '';
                  for (var f = 0; f < muni_data.length; f++) {
                    if (muni_data[f]['capital_type.code'] == aggregate_columns[column].code) {
                      row = muni_data[f];
                    }
                  }
                  data.push(row);
                });
              }
              this.renderMuniValues(muni, data, tr);
            } else {
              this.renderMuniValues(muni, muni_data && muni_data[0], tr);
            }
          }
        }
      }

      // highlighted rows
      for (var h = 0; h < toHighlight.length; h++) {
        var ix = toHighlight[h];
        this.$(`table.row-headings tr:eq(${ix}), table.values tr:eq(${ix})`)
          .addClass('toggled');
      }

      // jump to highlighted row on first render
      if (self.firstRender && toHighlight.length > 0) {
        self.firstRender = false;
        this.$('.table-display').scrollTop(this.$('table.row-headings .toggled').position().top - 50);
      }
    },

    renderMuniValues(muni, cell, tr) {
      if (CUBE_NAME == 'capital_v2') {
        for (var a = 0; a < Object.keys(self.aggregate_columns).length; a++) {
          if (cell[Object.keys(cell)[a]]) {
            var v = (cell ? cell[Object.keys(cell)[a]]['amount.sum'] : null);
            v = this.format(v);
          } else {
            v = '·';
          }
          tr.insertCell().innerText = v;
        }
      } else {
        for (var a = 0; a < cube.columns.length; a++) {
          var v = (cell ? cell[cube.columns[a]] : null);
          if (v === null) {
            v = '·';
          } else if (_.isNumber(v)) {
            v = this.format(v);
          }
          tr.insertCell().innerText = v;
        }
      }
    },

    renderDownloadLinks() {
      var self = this;

      if (this.downloadUrl && !_.isEmpty(this.filters.get('municipalities'))) {
        // setup urls
        this.$('.downloads .dropdown-menu a.download').attr('href', function () {
          return `${self.downloadUrl}&format=${$(this).data('format')}`;
        });
      } else {
        this.$('#downloadBtn').attr('disabled', true);
      }
    },

    rowClick(e) {
      var ix = $(e.currentTarget).index();
      this.$(`table.row-headings tr:eq(${ix}), table.values tr:eq(${ix})`)
        .toggleClass('toggled');
    },

    rowOver(e) {
      var ix = $(e.currentTarget).index();
      this.$(`table.row-headings tr:eq(${ix}), table.values tr:eq(${ix})`)
        .addClass('hover');
    },

    rowOut(e) {
      var ix = $(e.currentTarget).index();
      this.$(`table.row-headings tr:eq(${ix}), table.values tr:eq(${ix})`)
        .removeClass('hover');
    },

    functionHeadings() {
      var functions = this.filters.get('functions');
      functions = _.filter(cube.functions, (f) => _.contains(functions, f.code));
      return _.sortBy(functions, 'label');
    },
  });

  /** Overall table view on this page
   */
  var MainView = Backbone.View.extend({
    el: document,
    events: {
      'click button.accept': 'acceptTOU',
      'click button.decline': 'declineTOU',
    },

    initialize() {
      this.filters = new Filters();
      this.cells = new Cells();

      this.state = new State();
      this.loadState();
      this.state.on('change', this.saveState, this);

      this.filterView = new FilterView({ filters: this.filters, state: this.state });
      this.tableView = new TableView({ filters: this.filters, cells: this.cells, state: this.state });

      // show terms of use dialog?
      if (!Cookies.get('tou-ok')) {
        $('#terms-modal').modal();
      } else {
        this.acceptTOU();
      }
    },

    saveState() {
      if (history.replaceState) {
        var state = this.state.toJSON();
        var url = {
          year: state.year,
          month: state.month,
          municipalities: state.municipalities.join(','),
          amountType: state.amountType,
          functions: state.functions,
        };

        // make the query string url
        url = _.compact(_.map(url, (val, key) => {
          if (!_.isNaN(val) && (_.isNumber(val) || !_.isEmpty(val))) return `${key}=${encodeURIComponent(val)}`;
        })).join('&');

        history.replaceState({}, document.title, url ? (`?${url}`) : '');
      }
    },

    loadState() {
      // parse query string
      var params = {};
      var parts = document.location.search.substring(1).split('&');
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].split('=');
        params[p[0]] = decodeURIComponent(p[1]);
      }

      this.state.set({
        municipalities: params.municipalities ? params.municipalities.split(',') : [],
        year: parseInt(params.year) || null,
        month: parseInt(params.month) || null,
        // highlighted item codes
        items: params.items ? params.items.split(',') : [],
        amountType: (params.amountType),
        functions: params.functions ? params.functions.split(',') : [],
      });
    },

    showTOU() {
      $('#terms-modal').modal();
    },

    acceptTOU() {
      Cookies.set('tou-ok', true);
      $('#terms-modal').modal('hide');
      $('#terms-ok').removeClass('hidden');
    },

    declineTOU() {
      Cookies.remove('tou-ok');
      window.location = '/';
    },
  });
  exports.view = new MainView();
}(window));
