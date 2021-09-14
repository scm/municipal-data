from django.test import TestCase, Client, override_settings, TransactionTestCase
from django.conf import settings
from django.urls import reverse
from io import BytesIO
from django.contrib.auth.models import User
from django.contrib.admin.sites import AdminSite
from django_q.models import OrmQ
import rest_framework.response
import xlrd

from infrastructure.models import FinancialYear, QuarterlySpendFile, AnnualSpendFile, Expenditure, Project, BudgetPhase
from infrastructure.tests import utils
from infrastructure.utils import load_excel
from infrastructure.upload import process_document
from scorecard.models import Geography


def generate_mock_data():
    mock_data = { 'Function': 'Administrative and Corporate Support',
        'Project Description': 'P-CNIN FURN & OFF EQUIP',
        'Project Number': 'PC002003005_00002',
        'Type': 'New',
        'MTSF Service Outcome': 'An efficient, effective and development-oriented public service',
        'IUDF': 'Growth',
        'Own Strategic Objectives': 'OWN MUNICIPAL STRATEGIC OBJECTIVE',
        'Asset Class': 'Furniture and Office Equipment',
        'Asset Sub-Class': '',
        'Ward Location': 'Administrative or Head Office',
        'GPS Longitude': '0', 'GPS Latitude': '0',
        'Audited Outcome 2017/18': 340609.0,
        'Full Year Forecast 2018/19': 651391.0,
        'Budget year 2019/20': 500000.0,
        'Budget year 2020/21': 500000.0,
        'Budget year 2021/22': 500000.0
    }
    yield mock_data

def mock_data_existing_project():
    mock_data = { 'Function': 'Administrative and Corporate Support',
        'Project Description': 'P-CNIN FURN & OFF EQUIP',
        'Project Number': 'PC002003005_00002',
        'Type': 'Renewal',
        'MTSF Service Outcome': 'A project update',
        'IUDF': 'Governance',
        'Own Strategic Objectives': 'TO BE CORRECTED',
        'Asset Class': 'Furniture and Office',
        'Asset Sub-Class': 'Equipment',
        'Ward Location': 'Head Office',
        'GPS Longitude': '1', 'GPS Latitude': '2',
        'Audited Outcome 2018/19': 440609.0,
        'Full Year Forecast 2019/20': 551391.0,
        'Budget year 2020/21': 500000.0,
        'Budget year 2021/22': 500000.0,
        'Budget year 2022/23': 400000.0
    }
    yield mock_data

def mock_data_new_project():
    mock_data = { 'Function': 'Administrative and Corporate Support',
        'Project Description': 'P-CNIN FURN & OFF EQUIP - NEW DESCRIPTION',
        'Project Number': 'PC002003005_00002',
        'Type': 'Renewal',
        'MTSF Service Outcome': 'A project update',
        'IUDF': 'Governance',
        'Own Strategic Objectives': 'TO BE CORRECTED',
        'Asset Class': 'Furniture and Office',
        'Asset Sub-Class': 'Equipment',
        'Ward Location': 'Head Office',
        'GPS Longitude': '1', 'GPS Latitude': '2',
        'Audited Outcome 2018/19': 440609.0,
        'Full Year Forecast 2019/20': 551391.0,
        'Budget year 2020/21': 500000.0,
        'Budget year 2021/22': 500000.0,
        'Budget year 2022/23': 400000.0
    }
    yield mock_data


class FileTest(TransactionTestCase):
    fixtures = ["seeddata"]

    def setUp(self):
        self.client = Client()
        self.username = 'admin'
        self.email = 'test@whatever.com'
        self.password = 'password'
        self.user = User.objects.create_superuser(self.username, self.email, self.password)
        FileTest.geography = Geography.objects.create(
            geo_level="municipality",
            geo_code="BUF",
            province_name="Eastern Cape",
            province_code="EC",
            category="A",
        )


    def test_file_upload(self):
        """Scope of Test: Testing the file upload in Django Admin to processing file and add to Django_Q"""
        self.client.login(username=self.username, password=self.password)
        fy = FinancialYear.objects.create(budget_year="2019/2020", active=1)

        self.assertEquals(AnnualSpendFile.objects.all().count(), 0)
        self.assertEqual(OrmQ.objects.count(), 0)

        # the app name, the name of the model and the name of the view
        upload_url = reverse('admin:infrastructure_annualspendfile_add')

        with open('infrastructure/tests/test_files/test.xlsx', 'rb', ) as f:
            resp = self.client.post(upload_url, {'financial_year': fy.pk, 'document': f}, follow=True)
        self.assertContains(resp, "Dataset is currently being processed.", status_code=200)

        spend_file = AnnualSpendFile.objects.first()
        self.assertEquals(spend_file.status, AnnualSpendFile.PROGRESS)

        self.assertEqual(OrmQ.objects.count(), 1)
        task = OrmQ.objects.first()
        task_file_id = task.task()["args"][0]
        task_method = task.func()
        self.assertEqual(task_method, 'infrastructure.upload.process_document')
        self.assertEqual(task_file_id, spend_file.id)
        # run the code
        process_document(task_file_id)

        self.assertEquals(AnnualSpendFile.objects.count(), 1)
        spend_file = AnnualSpendFile.objects.first()
        self.assertEquals(spend_file.status, AnnualSpendFile.SUCCESS)
        self.assertEquals(Project.objects.count(), 2)

        response = self.client.get("/api/v1/infrastructure/search/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'PC002003005_00002')


    def test_file_upload_fail(self):
        """Scope of Test: Testing if the file upload fail in Django Admin to processing file and add to Django_Q"""
        self.client.login(username=self.username, password=self.password)
        fy = FinancialYear.objects.create(budget_year="2019/2020", active=1)

        self.assertEquals(FinancialYear.objects.all().count(), 1)
        self.assertEquals(AnnualSpendFile.objects.all().count(), 0)

        url = reverse('admin:infrastructure_annualspendfile_add')
        with open('infrastructure/tests/test_files/failtest.xlsx', 'rb', ) as f:
            resp = self.client.post(url, {'financial_year': fy.pk, 'document': f}, follow=True)
        self.assertContains(resp, "Dataset is currently being processed.", status_code=200)

        spend_file = AnnualSpendFile.objects.first()
        self.assertEquals(spend_file.status, AnnualSpendFile.PROGRESS)

        self.assertEqual(OrmQ.objects.count(), 1)
        task = OrmQ.objects.first()
        task_file_id = task.task()["args"][0]
        task_method = task.func()
        self.assertEqual(task_method, 'infrastructure.upload.process_document')
        self.assertEqual(task_file_id, spend_file.id)
        self.assertRaises(ValueError, process_document, task_file_id)

        self.assertEquals(AnnualSpendFile.objects.all().count(), 1)
        spend_file = AnnualSpendFile.objects.first()
        self.assertEquals(spend_file.status, AnnualSpendFile.ERROR)


    def test_year_error(self):
        """Scope of Test: Test if a file uploaded in Django Admin with incorrect year selection and content returns an error to Django_Q"""
        self.client.login(username=self.username, password=self.password)
        fy = FinancialYear.objects.create(budget_year="2019/2020", active=1)

        self.assertEquals(FinancialYear.objects.all().count(), 1)
        self.assertEquals(AnnualSpendFile.objects.all().count(), 0)

        url = reverse('admin:infrastructure_annualspendfile_add')
        with open('infrastructure/tests/test_files/failyear.xlsx', 'rb', ) as f:
            resp = self.client.post(url, {'financial_year': fy.pk, 'document': f}, follow=True)
        self.assertContains(resp, "Dataset is currently being processed.", status_code=200)

        spend_file = AnnualSpendFile.objects.first()
        self.assertEquals(spend_file.status, AnnualSpendFile.PROGRESS)

        self.assertEqual(OrmQ.objects.count(), 1)
        task = OrmQ.objects.first()
        task_file_id = task.task()["args"][0]
        task_method = task.func()
        self.assertEqual(task_method, 'infrastructure.upload.process_document')
        self.assertEqual(task_file_id, spend_file.id)
        self.assertRaises(ValueError, process_document, task_file_id)

        self.assertEquals(AnnualSpendFile.objects.all().count(), 1)
        spend_file = AnnualSpendFile.objects.first()
        self.assertEquals(spend_file.status, AnnualSpendFile.ERROR)


    def test_upload_project(self):
        """Scope of Test: With no existing projects run an upload and check that the correct fields are populated"""
        self.assertEquals(BudgetPhase.objects.all().count(), 5)

        geography = Geography.objects.get(geo_code="BUF")
        utils.load_file(geography, generate_mock_data(), "2019/2020")

        project = Project.objects.get(function="Administrative and Corporate Support")
        self.assertEquals(project.project_description, "P-CNIN FURN & OFF EQUIP")
        self.assertEquals(project.project_number, "PC002003005_00002")
        self.assertEquals(project.project_type, "New")
        self.assertEquals(project.mtsf_service_outcome, "An efficient, effective and development-oriented public service")
        self.assertEquals(project.iudf, "Growth")
        self.assertEquals(project.own_strategic_objectives, "OWN MUNICIPAL STRATEGIC OBJECTIVE")
        self.assertEquals(project.asset_class, "Furniture and Office Equipment")
        self.assertEquals(project.asset_subclass, "")
        self.assertEquals(project.ward_location, "Administrative or Head Office")
        self.assertEquals(project.longitude, 0.0)
        self.assertEquals(project.latitude, 0.0)

        self.assertEquals(Expenditure.objects.all().count(), 5)
        expenditure = Expenditure.objects.get(amount=340609.00)
        self.assertEquals(expenditure.project.project_description, "P-CNIN FURN & OFF EQUIP")
        self.assertEquals(expenditure.budget_phase.name, "Audited Outcome")
        self.assertEquals(expenditure.financial_year.budget_year, "2017/2018")


    def test_update_project(self):
        """Scope of Test: With an existing project import a new project with the same composite key and check that default fields are updated"""

        geography = Geography.objects.get(geo_code="BUF")
        utils.load_file(geography, generate_mock_data(), "2019/2020")

        project = Project.objects.get(project_description="P-CNIN FURN & OFF EQUIP")
        self.assertEquals(project.project_description, "P-CNIN FURN & OFF EQUIP")
        self.assertEquals(project.project_number, "PC002003005_00002")
        self.assertEquals(project.project_type, "New")
        self.assertEquals(project.mtsf_service_outcome, "An efficient, effective and development-oriented public service")
        self.assertEquals(project.iudf, "Growth")
        self.assertEquals(project.own_strategic_objectives, "OWN MUNICIPAL STRATEGIC OBJECTIVE")
        self.assertEquals(project.asset_class, "Furniture and Office Equipment")
        self.assertEquals(project.asset_subclass, "")
        self.assertEquals(project.ward_location, "Administrative or Head Office")
        self.assertEquals(project.longitude, 0.0)
        self.assertEquals(project.latitude, 0.0)

        utils.load_file(geography, mock_data_existing_project(), "2020/2021")
        self.assertEquals(BudgetPhase.objects.all().count(), 5)
        self.assertEquals(Project.objects.all().count(), 1)

        project = Project.objects.get(project_description="P-CNIN FURN & OFF EQUIP")
        self.assertEquals(project.project_type, "Renewal")
        self.assertEquals(project.mtsf_service_outcome, "A project update")
        self.assertEquals(project.iudf, "Governance")
        self.assertEquals(project.own_strategic_objectives, "TO BE CORRECTED")
        self.assertEquals(project.asset_class, "Furniture and Office")
        self.assertEquals(project.asset_subclass, "Equipment")
        self.assertEquals(project.ward_location, "Head Office")
        self.assertEquals(project.longitude, 1.0)
        self.assertEquals(project.latitude, 2.0)

        self.assertEquals(Expenditure.objects.all().count(), 8)
        expenditure = Expenditure.objects.get(amount=440609.00)
        self.assertEquals(expenditure.project.project_description, "P-CNIN FURN & OFF EQUIP")
        self.assertEquals(expenditure.budget_phase.name, "Audited Outcome")
        self.assertEquals(expenditure.financial_year.budget_year, "2018/2019")

    def test_new_project(self):
        """Scope of Test: With an existing project import a new project with a new composite key and check that a new  project is created"""

        geography = Geography.objects.get(geo_code="BUF")
        utils.load_file(geography, generate_mock_data(), "2019/2020")

        project = Project.objects.get(project_description="P-CNIN FURN & OFF EQUIP")
        self.assertEquals(project.project_description, "P-CNIN FURN & OFF EQUIP")
        self.assertEquals(project.project_number, "PC002003005_00002")
        self.assertEquals(project.project_type, "New")
        self.assertEquals(project.mtsf_service_outcome, "An efficient, effective and development-oriented public service")
        self.assertEquals(project.iudf, "Growth")
        self.assertEquals(project.own_strategic_objectives, "OWN MUNICIPAL STRATEGIC OBJECTIVE")
        self.assertEquals(project.asset_class, "Furniture and Office Equipment")
        self.assertEquals(project.asset_subclass, "")
        self.assertEquals(project.ward_location, "Administrative or Head Office")
        self.assertEquals(project.longitude, 0.0)
        self.assertEquals(project.latitude, 0.0)

        utils.load_file(geography, mock_data_new_project(), "2020/2021")
        self.assertEquals(BudgetPhase.objects.all().count(), 5)
        self.assertEquals(Project.objects.all().count(), 2)

        project = Project.objects.get(project_description="P-CNIN FURN & OFF EQUIP - NEW DESCRIPTION")
        self.assertEquals(project.project_type, "Renewal")
        self.assertEquals(project.mtsf_service_outcome, "A project update")
        self.assertEquals(project.iudf, "Governance")
        self.assertEquals(project.own_strategic_objectives, "TO BE CORRECTED")
        self.assertEquals(project.asset_class, "Furniture and Office")
        self.assertEquals(project.asset_subclass, "Equipment")
        self.assertEquals(project.ward_location, "Head Office")
        self.assertEquals(project.longitude, 1.0)
        self.assertEquals(project.latitude, 2.0)

        self.assertEquals(Expenditure.objects.all().count(), 10)
        expenditure = Expenditure.objects.get(amount=440609.00)
        self.assertEquals(expenditure.project.project_description, "P-CNIN FURN & OFF EQUIP - NEW DESCRIPTION")
        self.assertEquals(expenditure.budget_phase.name, "Audited Outcome")
        self.assertEquals(expenditure.financial_year.budget_year, "2018/2019")
