-- Reverter renomeação de user_credits para credits

ALTER TABLE user_credits RENAME TO credits;

-- Verificar
SELECT COUNT(*) FROM credits;
