from ...profile_data import ApiData
from ...profile_data.indicators import (
    CashCoverage,
)

from . import (
    import_data,
    _IndicatorTestCase,
)
from .resources import (
    GeographyResource,
    CashFlowFactsV1Resource,
    CashFlowFactsV2Resource,
    IncexpFactsV1Resource,
    IncexpFactsV2Resource,
)


class TestCashCoverage(_IndicatorTestCase):

    def test_result(self):
        # Load sample data
        import_data(
            GeographyResource,
            'cash_coverage/scorecard_geography.csv'
        )
        import_data(
            CashFlowFactsV1Resource,
            'cash_coverage/cash_flow_facts_v1.csv'
        )
        import_data(
            CashFlowFactsV2Resource,
            'cash_coverage/cash_flow_facts_v2.csv'
        )
        import_data(
            IncexpFactsV1Resource,
            'cash_coverage/income_expenditure_facts_v1.csv'
        )
        import_data(
            IncexpFactsV2Resource,
            'cash_coverage/income_expenditure_facts_v2.csv'
        )
        # Fetch data from API
        api_data = ApiData(self.api_client, "CPT", 2019, 2019, 2019, '2019q4')
        api_data.fetch_data([
            "operating_expenditure_actual_v1",
            "operating_expenditure_actual_v2",
            "cash_flow_v1",
            "cash_flow_v2",
        ])
        # Provide data to indicator
        result = CashCoverage.get_muni_specifics(api_data)
        self.assertEqual(
            result,
            {
                "result_type": "months",
                "values": [
                    {
                        "date": 2019,
                        "result": 2.4,
                        "rating": "ave",
                        "cube_version": "v2"
                    },
                    {
                        "date": 2018,
                        "result": 0,
                        "rating": "bad",
                        "cube_version": "v2"
                    },
                    {
                        "date": 2017,
                        "result": 1.4,
                        "rating": "ave",
                        "cube_version": "v1"
                    },
                    {
                        "date": 2016,
                        "result": 1.5,
                        "rating": "ave",
                        "cube_version": "v1"
                    }
                ],
                "ref": {
                    "title": "State of Local Government Finances",
                    "url": "http://mfma.treasury.gov.za/Media_Releases/The%20state%20of%20local%20government%20finances/Pages/default.aspx"
                },
                "last_year": 2019,
                "formula": {
                    "text": "= Cash available at year end / Operating Expenditure per month",
                    "actual": [
                        "=", 
                        {
                            "cube": "cflow",
                            "item_codes": ["4200"],
                            "amount_type": "AUDA",
                        },
                        "/",
                        "(",
                        {
                            "cube": "incexp",
                            "item_codes": ["4600"],
                            "amount_type": "ADJB",
                        },
                        "/",
                        "12",
                        ")",
                    ],
                },
                "formula_v2": {
                    "text": "= Cash available at year end / Operating Expenditure per month",
                    "actual": [
                        "=", 
                        {
                            "cube": "cflow_v2",
                            "item_codes": ["0430"],
                            "amount_type": "AUDA",
                        },
                        "/",
                        "(",
                        {
                            "cube": "incexp_v2",
                            "item_codes": ["2900"],
                            "amount_type": "ADJB",
                        },
                        "/",
                        "12",
                        ")",
                    ],
                },
            },
        )
