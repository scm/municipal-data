import { focusBlock } from '../utils.js';
import Dropdown from '../components/dropdown.js';

export default class HelpPage {
  constructor() {
    if (location.hash) {
      focusBlock(location.hash.substr(1));
    }
  }
}

const videoStorage = 'https://munimoney-media.s3.eu-west-1.amazonaws.com/info-videos/';
const infoVideo = $('#training .sub-section');
const title = '.informational-video_title';
const desc = '.informational-video_info p';
const toggleLang = '.language-dropdown .dropdown-toggle';
const downloadBtn = '.informational-video_download-button';
const currentLang = '.language-dropdown .dropdown__current-select';
const currentSize = '.size-dropdown .dropdown__current-select';

const videos = {
  'Introduction to Municapal Finance': {
    description: '',
    embed: 'HeQiX_e8ubg',
    languages: [
      ['English', 'eng'],
      ['isiXhosa', 'xhosa'],
      ['Afrikaans', 'afr'],
      ['Sotho', 'sotho'],
      ['Zulu', 'zulu'],
    ],
    files: {
      eng: [[66.9, 'Municipal_Money%3A_Intro_to_Municipal_Finance_English.mp4'], [27.7, 'compressed/Municipal%2BMoney_%2BIntro%2Bto%2BMunicipal%2BFinance%2BEnglish.mp4']],
      xhosa: [[73.2, 'Municipal_Money%3A_Intro_to_Municipal_Finance_isiXhosa.mp4'], [30.4, 'compressed/Municipal%2BMoney_%2BIntro%2Bto%2BMunicipal%2BFinance%2BisiXhosa.mp4']],
      afr: [[82.5, 'Municipal_Money%3A_Intro_to_Municipal_Finance_Afrikaans.mp4'], [27.8, 'compressed/Municipal%2BMoney_%2BIntro%2Bto%2BMunicipal%2BFinance%2BAfrikaans.mp4']],
      sotho: [[76.9, 'Municipal_Money%3A_Intro_to_Municipal_Finance_Sotho.mp4'], [27.7, 'compressed/Municipal%2BMoney_%2BIntro%2Bto%2BMunicipal%2BFinance%2BSotho.mp4']],
      zulu: [[87.2, 'Municipal_Money%3A_Intro_to_Municipal_Finance_Zulu.mp4'], [31.3, 'compressed/Municipal%2BMoney_%2BIntro%2Bto%2BMunicipal%2BFinance%2BZulu.mp4']],
    },
    sectionMarkers: ['intro'],
  },
  'Irregular, Fruitless and Wasteful Expenditure': {
    description: '',
    embed: 'WVZBVJTh0u0',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[22.7, 'Municipal_Money%3A_Irregular%2C_Fruitless_and_Wasteful_Expenditure.mp4'], [9.0, 'compressed/Municipal%2BMoney_%2BIrregular%2C%2BFruitless%2Band%2BWasteful%2BExpenditure.mp4']],
    },
    sectionMarkers: ['wasteful-expenditure'],
  },
  Liquidity: {
    description: '',
    embed: '6WUDTN7kBZI',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[13.6, 'Municipal_Money%3A_Liquidity.mp4'], [10.7, 'compressed/Municipal%2BMoney_%2BLiquidity.mp4']],
    },
    sectionMarkers: ['liquidity-ratio', 'current-ratio'],
  },
  'Sources of Income': {
    description: '',
    embed: 'zb2Wph6Mbpo',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[6.0, 'Municipal_Money%3A_Sources_of_Income.mp4']],
    },
    sectionMarkers: ['income'],
  },
  'Spending of the Capital Budget': {
    description: '',
    embed: 'L7rfUkK5PJI',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[12.5, 'Municipal_Money%3A_Spending_of_the_Capital_Budget.mp4'], [4.5, 'compressed/Municipal%2BMoney_%2BSpending%2Bof%2Bthe%2BCapital%2BBudget.mp4']],
    },
    sectionMarkers: ['capital-budget'],
  },
  'Spending of the Operating Budget': {
    description: '',
    embed: 'r8_W4Yn0Oz8',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[13.8, 'Municipal_Money%3A_Spending_of_the_Operating_Budget.mp4'], [5.1, 'compressed/Municipal%2BMoney_%2BSpending%2Bof%2Bthe%2BOperating%2BBudget.mp4']],
    },
    sectionMarkers: ['operating-budget'],
  },
  'Spending on Repairs & Maintenance': {
    description: '',
    embed: 'f2CdUnsEBXA',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[11.8, 'Municipal_Money%3A_Spending_on_Repairs_%26_Maintenance.mp4'], [4.9, 'compressed/Municipal%2BMoney_%2BSpending%2Bon%2BRepairs%2B_%2BMaintenance.mp4']],
    },
    sectionMarkers: ['repairs-maintenance'],
  },
  'Cash Balances and Cash Coverage': {
    description: '',
    embed: '-sGcopgP4u0',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[22.5, 'Municipal_Money%3A_Cash_Balances_and_Cash_Coverage.mp4'], [7.0, 'compressed/Municipal%2BMoney_%2BCash%2BBalances%2Band%2BCash%2BCoverage.mp4']],
    },
    sectionMarkers: ['cash-balance', 'cash-coverage'],
  },
  "Debtors' Collections Ratio": {
    description: '',
    embed: 'A15Fvwcx_OY',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[11.8, "Municipal_Money%3A_Debtors'_Collections_Ratio.mp4"], [4.5, 'compressed/Municipal%2BMoney%2BDebtors_%2BCollections%2BRatio.mp4']],
    },
    sectionMarkers: ['collection-rate'],
  },
  'Conditional Grants': {
    description: '',
    embed: 'bXL3p5khtio',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[57.4, 'Municipal_Money%3A_Conditional_Grants.mp4'], [8.7, 'compressed/Municipal_Money%3A_Conditional_Grants.mp4']],
    },
    sectionMarkers: ['grants'],
  },
  'Household Bills': {
    description: '',
    embed: 'GwvMI2GVwCg',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[129.6, 'Municipal_Money%3A_Household_Bills.mp4'], [13.9, 'compressed/Municipal_Money%3A_Household_Bills.mp4']],
    },
    sectionMarkers: ['household'],
  },
  'Capital Projects': {
    description: '',
    embed: 'i7KdL1b9tPk',
    languages: [
      ['English', 'eng'],
    ],
    files: {
      eng: [[12.2, 'Municipal_Money%3A_Capital_Projects.mp4'], [3.0, 'compressed/Municipal_Money%3A_Capital_Projects.mp4']],
    },
    sectionMarkers: ['municipal-budget'],
  },
};

$.each(videos, function (name, value) {
  var videoBlock = $('.informational-video_block:first').clone();
  videoBlock.find(title).text(name);
  videoBlock.find(desc).text(this.description);

  const initialLang = value.languages[0];
  const initialFile = value.files[initialLang[1]][0];
  videoBlock.find(downloadBtn).attr('href', videoStorage + initialFile[1]);

  this.dropdownLanguage = new Dropdown(videoBlock.find('.download-bar_select:first'), value.languages, initialLang[0]);
  this.dropdownSize = new Dropdown(videoBlock.find('.download-bar_select:eq( 1 )'), value.files[initialLang[1]], initialFile[0]);

  this.dropdownLanguage.$element.on('option-select', (e) => {
    const defaultFile = value.files[e.detail][0];
    this.dropdownSize = new Dropdown(videoBlock.find('.download-bar_select:eq( 1 )'), value.files[e.detail], defaultFile[0]);
    videoBlock.find(downloadBtn).attr('href', `${videoStorage}${defaultFile[1]}`);
  });
  this.dropdownSize.$element.on('option-select', (e) => {
    videoBlock.find(downloadBtn).attr('href', `${videoStorage}${e.detail}`);
  });

  // Disable language dropdown with only one option
  if (value.languages.length <= 1 && videoBlock.find(toggleLang).length > 0) {
    videoBlock.find(toggleLang)[0].style.cursor = 'default';
    videoBlock.find(toggleLang)[0].style.pointerEvents = 'none';
    videoBlock.find(toggleLang)[0].style.opacity = '0.7';
  }

  const videoEmbed = `<iframe frameborder='0' src='https://www.youtube.com/embed/${value.embed}'></iframe>`;
  videoBlock.find('.informational-video_video-wrapper').html(videoEmbed);
  videoBlock.appendTo(infoVideo);
  if (value.sectionMarkers.length > 0) {
    $.each(value.sectionMarkers, (name, marker) => {
      $(`<div id=${marker}-video style='scroll-margin-top: 60px;'></div>`).insertBefore(videoBlock);
    });
  }
});

$('.informational-video_block:first').hide();

function dropdownlist(e) {
  setTimeout(() => {
    if (e.currentTarget.children[0].attributes['aria-expanded'].value == 'true') {
      e.currentTarget.children[0].children[1].style.opacity = 0;
    }
  }, 0);
}
function showcurrent(e) {
  $(currentLang).attr('style', '');
  $(currentSize).attr('style', '');
}

$('body').on('click', showcurrent);
$('.language-dropdown').on('click', dropdownlist);
$('.size-dropdown').on('click', dropdownlist);
