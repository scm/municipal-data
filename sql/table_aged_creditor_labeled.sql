-- Table: public.aged_creditor_labeled

-- DROP TABLE public.aged_creditor_labeled;

CREATE TABLE public.aged_creditor_labeled
(
  demarcation_code text,
  period_code text,
  item_code text,
  g1_amount bigint,
  l1_amount bigint,
  l120_amount bigint,
  l150_amount bigint,
  l180_amount bigint,
  l30_amount bigint,
  l60_amount bigint,
  l90_amount bigint,
  total_amount bigint,
  item_label text,
  id serial,
  demarcation_label text,
  financial_year integer,
  period_length text,
  financial_period integer,
  amount_type_code text,
  amount_type_label text,
  position_in_return_form integer,
  return_form_structure text,
  composition text,
  CONSTRAINT aged_creditor_labeled_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.aged_creditor_labeled
  OWNER TO municipal_finance;