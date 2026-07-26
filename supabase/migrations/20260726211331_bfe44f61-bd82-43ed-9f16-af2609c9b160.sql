DELETE FROM public.history a USING public.history b
WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.document_id = b.document_id AND a.ai_feature_used = b.ai_feature_used;
CREATE UNIQUE INDEX IF NOT EXISTS history_user_document_feature_key
ON public.history (user_id, document_id, ai_feature_used);