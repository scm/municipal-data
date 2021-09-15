# -*- coding: utf-8 -*-
# Generated by Django 1.11.29 on 2021-09-15 14:45
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('infrastructure', '0017_auto_20210915_1604'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='annualspendfile',
            name='implementation_financial_year',
        ),
        migrations.AddField(
            model_name='annualspendfile',
            name='financial_year',
            field=models.ForeignKey(default='', on_delete=django.db.models.deletion.CASCADE, to='infrastructure.FinancialYear', verbose_name='Implementation financial year'),
            preserve_default=False,
        ),
    ]
