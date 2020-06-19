from .models import QuarterlySpendFile

from .utils import load_excel
import io


def process_document(id):
    """
    Get file an process it.
    """
    spend = QuarterlySpendFile.objects.get(id=id)
    try:
        excel_file = io.TextIOWrapper(spend.document.path.file)
        load_excel(excel_file, financial_year=spend.financial_year)
        spend.status = QuarterlySpendFile.SUCCESS
        spend.save()
    except Exception:
        spend.status = QuarterlySpendFile.ERROR
        spend.save()
        raise ValueError("Error processing file")
