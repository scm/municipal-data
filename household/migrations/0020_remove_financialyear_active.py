# -*- coding: utf-8 -*-
# Generated by Django 1.11.29 on 2022-09-13 09:20
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('household', '0019_auto_20220908_1443'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='financialyear',
            name='active',
        ),
    ]