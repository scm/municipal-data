# -*- coding: utf-8 -*-
# Generated by Django 1.11.29 on 2021-02-08 08:14
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('municipal_finance', '0037_v2_initial_data_reset'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='agedcreditorfactsv2update',
            options={'verbose_name': 'Aged Creditors Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='agedcreditoritemsv1',
            options={'verbose_name_plural': 'Aged Creditor Items (v1)'},
        ),
        migrations.AlterModelOptions(
            name='agedcreditoritemsv2',
            options={'verbose_name_plural': 'Aged Creditor Items (v2)'},
        ),
        migrations.AlterModelOptions(
            name='ageddebtorfactsv2update',
            options={'verbose_name': 'Aged Debtors Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='ageddebtoritemsv1',
            options={'verbose_name_plural': 'Aged Debtor Items (v1)'},
        ),
        migrations.AlterModelOptions(
            name='ageddebtoritemsv2',
            options={'verbose_name_plural': 'Aged Debtor Items (v2)'},
        ),
        migrations.AlterModelOptions(
            name='amounttype',
            options={'verbose_name_plural': 'Amount Type (v1)'},
        ),
        migrations.AlterModelOptions(
            name='amounttypev2',
            options={'verbose_name_plural': 'Amount Type (v2)'},
        ),
        migrations.AlterModelOptions(
            name='auditopinionfactsupdate',
            options={'verbose_name': 'Audit Opinion Facts Update'},
        ),
        migrations.AlterModelOptions(
            name='bsheetitemsv1',
            options={'verbose_name_plural': 'Balance Sheet Items (v1)'},
        ),
        migrations.AlterModelOptions(
            name='capitalfactsv2update',
            options={'verbose_name': 'Capital Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='capitalitemsv1',
            options={'verbose_name_plural': 'Capital Items (v1)'},
        ),
        migrations.AlterModelOptions(
            name='capitaltypev2',
            options={'verbose_name_plural': 'Capital Items (v2)'},
        ),
        migrations.AlterModelOptions(
            name='cashflowv2update',
            options={'verbose_name': 'Cash Flow Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='cflowitemsv1',
            options={'verbose_name_plural': 'Cash Flow Items (v1)'},
        ),
        migrations.AlterModelOptions(
            name='cflowitemsv2',
            options={'verbose_name_plural': 'Cash Flow Items (v2)'},
        ),
        migrations.AlterModelOptions(
            name='conditionalgranttypesv1',
            options={'verbose_name_plural': 'Conditional Grant Types (v1)'},
        ),
        migrations.AlterModelOptions(
            name='financialpositionfactsv2update',
            options={'verbose_name': 'Financial Position Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='financialpositionitemsv2',
            options={'verbose_name_plural': 'Balance Sheet Items (v2)'},
        ),
        migrations.AlterModelOptions(
            name='governmentfunctionsv1',
            options={'verbose_name_plural': 'Goverment Functions (v1)'},
        ),
        migrations.AlterModelOptions(
            name='governmentfunctionsv2',
            options={'verbose_name_plural': 'Goverment Functions (v2)'},
        ),
        migrations.AlterModelOptions(
            name='grantfactsv2update',
            options={'verbose_name': 'Grant Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='granttypesv2',
            options={'verbose_name_plural': 'Grant Types (v2)'},
        ),
        migrations.AlterModelOptions(
            name='incexpitemsv1',
            options={'verbose_name_plural': 'Income & Expenditure Items (v1)'},
        ),
        migrations.AlterModelOptions(
            name='incexpitemsv2',
            options={'verbose_name_plural': 'Income & Expenditure Items (v2)'},
        ),
        migrations.AlterModelOptions(
            name='incomeexpenditurev2update',
            options={'verbose_name': 'Income & Expenditure Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='municipalityprofilescompilation',
            options={'verbose_name': 'Municipality Profile Compilation'},
        ),
        migrations.AlterModelOptions(
            name='municipalstaffcontactsupdate',
            options={'verbose_name': 'Municipal Staff Contacts Update'},
        ),
        migrations.AlterModelOptions(
            name='repairsmaintenanceitemsv1',
            options={'verbose_name_plural': 'Repairs & Maintenance Items (v1)'},
        ),
        migrations.AlterModelOptions(
            name='repairsmaintenanceitemsv2',
            options={'verbose_name_plural': 'Repairs & Maintenance Items (v2)'},
        ),
        migrations.AlterModelOptions(
            name='repairsmaintenancev2update',
            options={'verbose_name': 'Repairs & Maintenance Facts (v2) Update'},
        ),
        migrations.AlterModelOptions(
            name='uifwexpensefactsupdate',
            options={'verbose_name': 'UIFW Expense Facts Update'},
        ),
    ]
