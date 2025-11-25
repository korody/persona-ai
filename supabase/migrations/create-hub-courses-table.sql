-- Criar tabela hub_courses para armazenar cursos do Memberkit

CREATE TABLE IF NOT EXISTS hub_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- IDs do Memberkit
  memberkit_course_id INTEGER NOT NULL UNIQUE,
  memberkit_course_slug VARCHAR NOT NULL,
  
  -- Informações básicas
  course_name VARCHAR NOT NULL,
  description TEXT,
  
  -- URLs
  course_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Metadados
  total_lessons INTEGER DEFAULT 0,
  total_sections INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hub_courses_memberkit_id 
  ON hub_courses(memberkit_course_id);

CREATE INDEX IF NOT EXISTS idx_hub_courses_published 
  ON hub_courses(is_published);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_hub_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hub_courses_updated_at ON hub_courses;
CREATE TRIGGER hub_courses_updated_at
  BEFORE UPDATE ON hub_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_courses_updated_at();

-- Comentários
COMMENT ON TABLE hub_courses IS 'Cursos sincronizados do Memberkit';
COMMENT ON COLUMN hub_courses.memberkit_course_id IS 'ID do curso no Memberkit';
COMMENT ON COLUMN hub_courses.course_url IS 'URL do curso no Memberkit';
COMMENT ON COLUMN hub_courses.total_lessons IS 'Total de aulas (lessons) neste curso';

-- Verificar
SELECT * FROM hub_courses LIMIT 5;
