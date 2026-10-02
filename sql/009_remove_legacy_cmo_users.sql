-- CMO offices authenticate through cmo_accounts and must not have users rows.
-- Preserve audit references by relying on existing ON DELETE SET NULL constraints.
DELETE FROM users
WHERE role IN ('CMO_DISTRICT', 'CMO_STATE', 'CMO_NOMINEE_AC');
