# -*- coding: utf-8 -*-
# Generated by Django 1.11.29 on 2022-10-26 17:51
from __future__ import unicode_literals

from django.db import migrations, models
from django_q.tasks import async_task


def populate_data_summary(apps, schema_editor):
    async_task(
        "municipal_finance.summarise_data.summarise",
        task_name="Summarise Data",
    )

class Migration(migrations.Migration):

    dependencies = [
        ('municipal_finance', '0043_auto_20220920_1717'),
    ]

    operations = [
        migrations.CreateModel(
            name='Summary',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.TextField(unique=True)),
                ('content', models.TextField()),
            ],
            options={
                'verbose_name_plural': 'Data Summaries',
                'db_table': 'data_summaries',
            },
        ),
        migrations.RunPython(populate_data_summary),
    ]
