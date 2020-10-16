# -*- coding: utf-8 -*-
# Generated by Django 1.11.28 on 2020-10-15 12:41
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('municipal_finance', '0011_auto_20201006_1745'),
    ]

    operations = [
        migrations.CreateModel(
            name='MedianGroup',
            fields=[
                ('group_id', models.CharField(max_length=10, primary_key=True, serialize=False)),
                ('data', django.contrib.postgres.fields.jsonb.JSONField()),
            ],
        ),
        migrations.CreateModel(
            name='RatingCountGroup',
            fields=[
                ('group_id', models.CharField(max_length=10, primary_key=True, serialize=False)),
                ('data', django.contrib.postgres.fields.jsonb.JSONField()),
            ],
        ),
    ]
