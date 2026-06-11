-- =========================================================================
-- SCRIPT DE CONFIGURAÇÃO E POPULAÇÃO DA TABELA DE CONVIDADOS ("guests")
-- Copie e execute este script completo no SQL Editor do seu painel do Supabase.
-- =========================================================================

-- 1. Remover a tabela antiga para limpar os dados anteriores
DROP TABLE IF EXISTS guests;

-- 2. Criar a nova tabela de convidados estruturada para as relações familiares
CREATE TABLE guests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    companions_count INTEGER DEFAULT 0,
    is_confirmed BOOLEAN DEFAULT false,
    responsible_adult TEXT,
    associated_child TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar leitura pública anônima (caso queira que os convidados consultem sem autenticação)
-- Nota: Caso o RLS esteja ativo em seu Supabase, estas regras garantem o funcionamento correto:
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Autorizar que qualquer usuário anônimo busque convidados por nome/código
CREATE POLICY "Permitir busca anônima de convidados" 
ON guests FOR SELECT 
TO public 
USING (true);

-- Autorizar que qualquer usuário atualize a confirmação de presença (is_confirmed e confirmed_at)
CREATE POLICY "Permitir atualização de confirmação" 
ON guests FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);


-- 3. Inserir a nova lista completa de convidados com suas associações
-- O sistema identificará automaticamente Adulto Responsável ou Criança Associada se preenchido.
INSERT INTO guests (id, name, code, companions_count, is_confirmed, responsible_adult, associated_child) VALUES
-- 1: Zeca, Mavis (2)
('G-1', 'Zeca', 'ZECA', 1, false, NULL, 'Mavis'),
('G-1-C', 'Mavis', 'MAVIS', 0, false, 'Zeca', NULL),

-- 2: Gabriel (1)
('G-2', 'Gabriel', 'GABRIEL', 0, false, NULL, NULL),

-- 3: Dayane (1)
('G-3', 'Dayane', 'DAYANE', 0, false, NULL, NULL),

-- 4: Larissa (1)
('G-4', 'Larissa', 'LARISSA', 0, false, NULL, NULL),

-- 5: Emanuel (1)
('G-5', 'Emanuel', 'EMANUEL', 0, false, NULL, NULL),

-- 6: Mari (1)
('G-6', 'Mari', 'MARI', 0, false, NULL, NULL),

-- 7: Matheus (1)
('G-7', 'Matheus', 'MATHEUS', 0, false, NULL, NULL),

-- 8: Duda (1)
('G-8', 'Duda', 'DUDA', 0, false, NULL, NULL),

-- 9: Vitor (1)
('G-9', 'Vitor', 'VITOR', 0, false, NULL, NULL),

-- 10: Gilmar (1)
('G-10', 'Gilmar', 'GILMAR', 0, false, NULL, NULL),

-- 11: Dilmar (1)
('G-11', 'Dilmar', 'DILMAR', 0, false, NULL, NULL),

-- 12: Luiza (1)
('G-12', 'Luiza', 'LUIZA', 0, false, NULL, NULL),

-- 13: Fátima (1)
('G-13', 'Fátima', 'FATIMA', 0, false, NULL, NULL),

-- 15: Emerson (1)
('G-15', 'Emerson', 'EMERSON', 0, false, NULL, NULL),

-- 16: Sueli, Livia, Manu, Lucas, Isaac (5)
('G-16', 'Sueli', 'SUELI', 4, false, NULL, 'Livia, Manu, Lucas e Isaac'),
('G-16-C1', 'Livia', 'LIVIA', 0, false, 'Sueli', NULL),
('G-16-C2', 'Manu', 'MANU', 0, false, 'Sueli', NULL),
('G-16-C3', 'Lucas', 'LUCAS', 0, false, 'Sueli', NULL),
('G-16-C4', 'Isaac', 'ISAAC', 0, false, 'Sueli', NULL),

-- 17: Miguel (1)
('G-17', 'Miguel', 'MIGUEL', 0, false, NULL, NULL),

-- 18: Rebeca (1)
('G-18', 'Rebeca', 'REBECA', 0, false, NULL, NULL),

-- 21: Daniele (1)
('G-21', 'Daniele', 'DANIELE', 0, false, NULL, NULL),

-- 22: Antônio (1)
('G-22', 'Antônio', 'ANTONIO', 0, false, NULL, NULL),

-- 23: Marcos (1)
('G-23', 'Marcos', 'MARCOS', 0, false, NULL, NULL),

-- 24: Sebastiana (1)
('G-24', 'Sebastiana', 'SEBASTIANA', 0, false, NULL, NULL),

-- 25: Kaka (1)
('G-25', 'Kaka', 'KAKA', 0, false, NULL, NULL),

-- 26: Nayara, Elisa (2)
('G-26', 'Nayara', 'NAYARA', 1, false, NULL, 'Elisa'),
('G-26-C1', 'Elisa', 'ELISA', 0, false, 'Nayara', NULL),

-- 27: Nayra, Bia, Pedro, Isabelly (4)
('G-27', 'Nayra', 'NAYRA', 3, false, NULL, 'Bia, Pedro e Isabelly'),
('G-27-C1', 'Bia', 'BIA', 0, false, 'Nayra', NULL),
('G-27-C2', 'Pedro', 'PEDRO', 0, false, 'Nayra', NULL),
('G-27-C3', 'Isabelly', 'ISABELLY', 0, false, 'Nayra', NULL),

-- 31: Beatriz (1)
('G-31', 'Beatriz', 'BEATRIZ', 0, false, NULL, NULL),

-- 32: Alessandra (1)
('G-32', 'Alessandra', 'ALESSANDRA', 0, false, NULL, NULL),

-- 33: Sabrina (1)
('G-33', 'Sabrina', 'SABRINA', 0, false, NULL, NULL),

-- 34: Jaciara (1)
('G-34', 'Jaciara', 'JACIARA', 0, false, NULL, NULL),

-- 35: David, Jonathan (2)
('G-35', 'David', 'DAVID', 1, false, NULL, 'Jonathan'),
('G-35-C1', 'Jonathan', 'JONATHAN', 0, false, 'David', NULL),

-- 36: tais (1)
('G-36', 'tais', 'TAIS', 0, false, NULL, NULL);

-- =========================================================================
-- 4. Criar a tabela de mensagens / mural de bênçãos para que todos vejam as mensagens de todos
-- =========================================================================
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para segurança
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública anônima no mural de bênçãos
DROP POLICY IF EXISTS "Permitir leitura anônima de mensagens" ON messages;
CREATE POLICY "Permitir leitura anônima de mensagens" 
ON messages FOR SELECT 
TO public 
USING (true);

-- Permitir inserção pública anônima para que qualquer convidado envie mensagens
DROP POLICY IF EXISTS "Permitir inserção anônima de mensagens" ON messages;
CREATE POLICY "Permitir inserção anônima de mensagens" 
ON messages FOR INSERT 
TO public 
WITH CHECK (true);

