# -*- coding: utf-8 -*-
# Generated by Django 1.11.23 on 2020-05-08 11:19
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metro', '0010_auto_20200507_1423'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='slug',
            field=models.SlugField(null=True),
        ),
        migrations.AlterField(
            model_name='indicatorquarterresult',
            name='quarter_four',
            field=models.CharField(max_length=20, null=True, verbose_name='Q4'),
        ),
        migrations.AlterField(
            model_name='indicatorquarterresult',
            name='quarter_one',
            field=models.CharField(max_length=20, null=True, verbose_name='Q1'),
        ),
        migrations.AlterField(
            model_name='indicatorquarterresult',
            name='quarter_three',
            field=models.CharField(max_length=20, null=True, verbose_name='Q3'),
        ),
        migrations.AlterField(
            model_name='indicatorquarterresult',
            name='quarter_two',
            field=models.CharField(max_length=20, null=True, verbose_name='Q2'),
        ),
    ]