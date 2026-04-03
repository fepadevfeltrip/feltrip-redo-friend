-- Create the feltrip_local_picks table for curated services
CREATE TABLE public.feltrip_local_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'school', 'housing', 'health', 'legal', etc.
  subcategory TEXT, -- 'international', 'montessori', 'public', 'traditional', etc.
  city TEXT NOT NULL, -- 'Rio de Janeiro', 'São Paulo', etc.
  neighborhood TEXT, -- 'Tijuca', 'Botafogo', 'Gávea', etc.
  description TEXT,
  description_en TEXT, -- English description
  website TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  tags TEXT[] DEFAULT '{}', -- for search keywords
  highlights TEXT[], -- key features/highlights
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feltrip_local_picks ENABLE ROW LEVEL SECURITY;

-- Create policy for all authenticated users to view active picks
CREATE POLICY "Authenticated users can view active local picks"
ON public.feltrip_local_picks
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create policy for Owner and Admin to manage all picks
CREATE POLICY "Owner and Admin can manage local picks"
ON public.feltrip_local_picks
FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for common queries
CREATE INDEX idx_local_picks_category ON public.feltrip_local_picks(category);
CREATE INDEX idx_local_picks_city ON public.feltrip_local_picks(city);
CREATE INDEX idx_local_picks_neighborhood ON public.feltrip_local_picks(neighborhood);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feltrip_local_picks_updated_at
BEFORE UPDATE ON public.feltrip_local_picks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the schools data for Rio de Janeiro

-- Tijuca
INSERT INTO public.feltrip_local_picks (name, category, subcategory, city, neighborhood, description, description_en, website, highlights, tags) VALUES
('Maria Felipa', 'school', 'alternative', 'Rio de Janeiro', 'Tijuca', 
 'Escola afrocentrada e trilíngue (Português, Inglês e Libras). Foco na valorização da cultura afro-brasileira.',
 'Afro-centered and trilingual school (Portuguese, English and Libras). Focus on valuing Afro-Brazilian culture.',
 'escolamariafelipa.com.br', 
 ARRAY['Afrocentrada', 'Trilíngue', 'Libras'], 
 ARRAY['escola', 'school', 'afro', 'bilingual', 'libras', 'tijuca']),

('Meimei Escola', 'school', 'montessori', 'Rio de Janeiro', 'Tijuca',
 'Pedagogia Montessori. Foco na autonomia e ambiente preparado.',
 'Montessori pedagogy. Focus on autonomy and prepared environment.',
 'meimeiescola.com.br',
 ARRAY['Montessori', 'Autonomia', 'Ambiente Preparado'],
 ARRAY['escola', 'school', 'montessori', 'tijuca', 'alternative']),

('Colégio Santos Anjos', 'school', 'traditional', 'Rio de Janeiro', 'Tijuca',
 'Católica tradicional e humana. Rua 18 de Outubro, 95.',
 'Traditional and humane Catholic school.',
 'redesantosanjos.com.br',
 ARRAY['Católica', 'Tradicional', 'Valores Cristãos'],
 ARRAY['escola', 'school', 'catholic', 'traditional', 'tijuca']),

('Oga Mitá', 'school', 'progressive', 'Rio de Janeiro', 'Tijuca',
 'Construtivista, progressista e focada em pensamento crítico.',
 'Constructivist, progressive and focused on critical thinking.',
 'ogamita.com.br',
 ARRAY['Construtivista', 'Progressista', 'Pensamento Crítico'],
 ARRAY['escola', 'school', 'constructivist', 'progressive', 'tijuca']),

('Colégio Batista Shepard', 'school', 'traditional', 'Rio de Janeiro', 'Tijuca',
 'Valores cristãos e sólida base acadêmica.',
 'Christian values and solid academic foundation.',
 'batista.br',
 ARRAY['Batista', 'Valores Cristãos', 'Base Acadêmica'],
 ARRAY['escola', 'school', 'baptist', 'christian', 'tijuca']),

('Pensi', 'school', 'preparatory', 'Rio de Janeiro', 'Tijuca',
 'Alta Performance. Foco total em vestibular/ENEM com excelente qualidade e preços muito menores que os da Zona Sul.',
 'High Performance. Total focus on vestibular/ENEM with excellent quality and much lower prices than Zona Sul.',
 'pensi.com.br',
 ARRAY['Alta Performance', 'Vestibular', 'ENEM', 'Preço Acessível'],
 ARRAY['escola', 'school', 'vestibular', 'enem', 'preparatory', 'tijuca']),

('Instituto de Arte Tear', 'school', 'extracurricular', 'Rio de Janeiro', 'Tijuca',
 'Referência em arte-educação (circo, teatro, artes). Atividades extracurriculares.',
 'Reference in art-education (circus, theater, arts). Extracurricular activities.',
 'institutotear.org.br',
 ARRAY['Arte-educação', 'Circo', 'Teatro', 'Artes'],
 ARRAY['escola', 'school', 'art', 'theater', 'circus', 'extracurricular', 'tijuca']),

-- Botafogo, Urca e Gávea
('The British School', 'school', 'international', 'Rio de Janeiro', 'Botafogo',
 'Prestigiada e tradicional escola britânica. Educação Infantil e Primário em Urca, Ensino Médio na Barra.',
 'Prestigious and traditional British school. Early Years and Primary in Urca, High School in Barra.',
 'britishschool.g12.br',
 ARRAY['Britânica', 'Internacional', 'Currículo UK'],
 ARRAY['escola', 'school', 'british', 'international', 'botafogo', 'urca', 'barra']),

('Escola Eleva', 'school', 'international', 'Rio de Janeiro', 'Botafogo',
 'A "queridinha dos modernos". Currículo bilíngue de ponta e infraestrutura tecnológica.',
 'The "darling of the moderns". Cutting-edge bilingual curriculum and technological infrastructure.',
 'escolaeleva.com.br',
 ARRAY['Bilíngue', 'Tecnologia', 'Moderno', 'Infraestrutura'],
 ARRAY['escola', 'school', 'bilingual', 'technology', 'modern', 'botafogo']),

('Escola Alemã Corcovado', 'school', 'international', 'Rio de Janeiro', 'Botafogo',
 'Sistema bicultural de excelência. Currículo alemão e brasileiro.',
 'Bicultural system of excellence. German and Brazilian curriculum.',
 'eacorcovado.com.br',
 ARRAY['Alemã', 'Bicultural', 'Excelência'],
 ARRAY['escola', 'school', 'german', 'international', 'bicultural', 'botafogo']),

('Colégio Santo Inácio', 'school', 'traditional', 'Rio de Janeiro', 'Botafogo',
 'Católica (Jesuíta), rigorosa e tradicional.',
 'Catholic (Jesuit), rigorous and traditional.',
 'santoinacio-rio.com.br',
 ARRAY['Jesuíta', 'Católica', 'Tradicional', 'Rigorosa'],
 ARRAY['escola', 'school', 'jesuit', 'catholic', 'traditional', 'botafogo']),

('Liessin', 'school', 'traditional', 'Rio de Janeiro', 'Botafogo',
 'Escola judaica que une tradição e humanismo.',
 'Jewish school that combines tradition and humanism.',
 'liessin.com.br',
 ARRAY['Judaica', 'Tradição', 'Humanismo'],
 ARRAY['escola', 'school', 'jewish', 'tradition', 'humanism', 'botafogo']),

('Eliezer Max', 'school', 'traditional', 'Rio de Janeiro', 'Botafogo',
 'Escola judaica que une tradição e humanismo.',
 'Jewish school that combines tradition and humanism.',
 'eliezermax.com.br',
 ARRAY['Judaica', 'Tradição', 'Humanismo'],
 ARRAY['escola', 'school', 'jewish', 'tradition', 'humanism', 'botafogo']),

('Escola Casa da Mangueira', 'school', 'alternative', 'Rio de Janeiro', 'Botafogo',
 'Focada na pequena infância e no brincar livre.',
 'Focused on early childhood and free play.',
 'casadamangueira.com.br',
 ARRAY['Pequena Infância', 'Brincar Livre', 'Acolhedora'],
 ARRAY['escola', 'school', 'early-childhood', 'free-play', 'botafogo']),

('Escola Americana (EARJ)', 'school', 'international', 'Rio de Janeiro', 'Gávea',
 'O padrão ouro para o currículo dos Estados Unidos.',
 'The gold standard for the United States curriculum.',
 'earj.com.br',
 ARRAY['Americana', 'Currículo USA', 'Padrão Ouro'],
 ARRAY['escola', 'school', 'american', 'international', 'us-curriculum', 'gavea']),

-- Laranjeiras e Santa Teresa
('Liceu Molière', 'school', 'international', 'Rio de Janeiro', 'Laranjeiras',
 'Escola Francesa com currículo oficial francês.',
 'French school with official French curriculum.',
 'resmoliere.com.br',
 ARRAY['Francesa', 'Currículo Francês', 'Oficial'],
 ARRAY['escola', 'school', 'french', 'international', 'laranjeiras']),

('Colégio Laranjeiras', 'school', 'alternative', 'Rio de Janeiro', 'Laranjeiras',
 'Inovação e base alemã.',
 'Innovation and German foundation.',
 'colegiolaranjeiras.com.br',
 ARRAY['Inovação', 'Base Alemã'],
 ARRAY['escola', 'school', 'german', 'innovation', 'laranjeiras']),

('Miraflores', 'school', 'alternative', 'Rio de Janeiro', 'Laranjeiras',
 'Bilíngue e visão holística.',
 'Bilingual with holistic vision.',
 'miraflores.com.br',
 ARRAY['Bilíngue', 'Holística'],
 ARRAY['escola', 'school', 'bilingual', 'holistic', 'laranjeiras']),

('CEAT', 'school', 'progressive', 'Rio de Janeiro', 'Santa Teresa',
 'Progressista e comunitária.',
 'Progressive and community-based.',
 'ceat.org.br',
 ARRAY['Progressista', 'Comunitária'],
 ARRAY['escola', 'school', 'progressive', 'community', 'santa-teresa']),

('A Monte Alegre', 'school', 'alternative', 'Rio de Janeiro', 'Santa Teresa',
 'Creche afetuosa em casarão histórico.',
 'Affectionate daycare in historic mansion.',
 'casamontealegre.com.br',
 ARRAY['Creche', 'Afetuosa', 'Casarão Histórico'],
 ARRAY['escola', 'school', 'daycare', 'historic', 'santa-teresa']),

-- Sistema Público e Ensino Superior
('Colégio Pedro II', 'school', 'public', 'Rio de Janeiro', 'Centro',
 'A instituição federal mais tradicional do Brasil. Acesso por sorteio ou prova.',
 'Brazil''s most traditional federal institution. Access by lottery or exam.',
 'cp2.g12.br',
 ARRAY['Federal', 'Tradicional', 'Gratuita', 'Excelência'],
 ARRAY['escola', 'school', 'public', 'federal', 'traditional', 'free']),

('CAP UFRJ', 'school', 'public', 'Rio de Janeiro', 'Lagoa',
 'Colégio de Aplicação da UFRJ. Escola-laboratório ligada à universidade.',
 'UFRJ Application College. Laboratory school linked to the university.',
 'cap.ufrj.br',
 ARRAY['Universitária', 'Laboratório', 'UFRJ', 'Gratuita'],
 ARRAY['escola', 'school', 'public', 'university', 'ufrj']),

('CAP UERJ', 'school', 'public', 'Rio de Janeiro', 'Maracanã',
 'Colégio de Aplicação da UERJ. Escola-laboratório ligada à universidade.',
 'UERJ Application College. Laboratory school linked to the university.',
 'cap.uerj.br',
 ARRAY['Universitária', 'Laboratório', 'UERJ', 'Gratuita'],
 ARRAY['escola', 'school', 'public', 'university', 'uerj']),

('PUC-Rio', 'school', 'university', 'Rio de Janeiro', 'Gávea',
 'Excelente para pós-graduação e cursos de extensão (CCE).',
 'Excellent for graduate studies and extension courses (CCE).',
 'ccec.puc-rio.br',
 ARRAY['Pós-graduação', 'Extensão', 'Universidade'],
 ARRAY['universidade', 'university', 'graduate', 'extension', 'gavea']),

('Casa do Saber', 'school', 'adult-education', 'Rio de Janeiro', 'Botafogo',
 'Hub cultural para estudos de filosofia, artes e história.',
 'Cultural hub for philosophy, arts and history studies.',
 'casadosaber.com.br',
 ARRAY['Filosofia', 'Artes', 'História', 'Cultura'],
 ARRAY['educacao', 'education', 'philosophy', 'arts', 'culture', 'adult', 'botafogo']);