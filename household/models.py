from django.db import models
from django.db.models import Q

from scorecard.models import Geography


class DataSetVersion(models.Model):
    version = models.IntegerField(unique=True)

    def __str__(self):
        return f"{self.version}"



class DataSetFile(models.Model):
    csv_file = models.FileField(upload_to='datasets/')
    version = models.ForeignKey(DataSetVersion, on_delete=models.CASCADE)
    file_type = models.CharField(max_length=20, null=True)

    def __str__(self):
        return f'{self.file_type}-{self.version}'




class FinancialYear(models.Model):
    budget_year = models.CharField(max_length=10)
    active = models.BooleanField(default=False)

    def __str__(self):
        return self.budget_year


class BudgetPhase(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name



class HouseholdClass(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class HouseholdService(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name



class HouseholdServiceTotalQuerySet(models.QuerySet):
    def active(self, geo_code):
        return self.filter(Q(budget_phase__name='Audited Outcome') | Q(budget_phase__name='Original Budget') | Q(budget_phase__name='Budget Year'),geography__geo_code=geo_code,financial_year__active=True)

    def middle(self):
        return self.filter(household_class__name='Middle Income Range').values('financial_year__budget_year', 'total', 'service__name')

    def affordable(self):
        return self.filter(household_class__name='Affordable Range').values('financial_year__budget_year', 'total', 'service__name')

    def indigent(self):
        return self.filter(household_class__name='Indigent HH receiving FBS').values('financial_year__budget_year', 'total', 'service__name')
        

class HouseholdServiceTotal(models.Model):
    geography = models.ForeignKey(Geography, on_delete=models.CASCADE)
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.CASCADE)
    budget_phase = models.ForeignKey(BudgetPhase, on_delete=models.CASCADE)
    household_class = models.ForeignKey(HouseholdClass, on_delete=models.CASCADE)
    service = models.ForeignKey(HouseholdService, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    version = models.ForeignKey(DataSetVersion, on_delete=models.CASCADE, default=1)

    objects = models.Manager()
    summary = HouseholdServiceTotalQuerySet.as_manager()

    class Meta:
        unique_together = ('financial_year', 'budget_phase', 'household_class', 'service', 'total')


    def __str__(self):
        return f'{self.household_class} - {self.service} - {self.total}'


class HouseholdBillTotalQuerySet(models.QuerySet):
    def active(self, geo_code):
        return self.filter(financial_year__active=True, geography__geo_code=geo_code)
    
    def audited(self):
        return self.filter(
            budget_phase__name='Audited Outcome').values('financial_year__budget_year',
                                                         'household_class__name', 'total')

    def original(self):
        return self.filter(
            budget_phase__name='Original Budget').values('financial_year__budget_year',
                                                         'household_class__name', 'total')
    def budgeted(self):
        return self.filter(
            budget_phase__name='Budget Year').values('financial_year__budget_year',
                                                     'household_class__name', 'total')
    
class HouseholdBillTotal(models.Model):
    geography = models.ForeignKey(Geography, on_delete=models.CASCADE)
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.CASCADE)
    budget_phase = models.ForeignKey(BudgetPhase, on_delete=models.CASCADE)
    household_class = models.ForeignKey(HouseholdClass, on_delete=models.CASCADE)
    percent = models.FloatField(null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    version = models.ForeignKey(DataSetVersion, on_delete=models.CASCADE, default=1)

    objects = models.Manager()
    summary = HouseholdBillTotalQuerySet.as_manager()

    def __str__(self):
        return f'{self.household_class} - {self.total}'