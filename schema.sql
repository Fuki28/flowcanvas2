-- ══════════════════════════════════════════════════════════════
-- FlowCanvas — Schema SQL v2 para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLAS ───────────────────────────────────────────────────

-- Perfil de usuario (username + relación con auth.users)
CREATE TABLE IF NOT EXISTS perfiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE NOT NULL,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etapas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6B5CE7',
  orden      INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trabajos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  cliente_id  UUID REFERENCES clientes(id) ON DELETE SET NULL,
  etapa_id    UUID REFERENCES etapas(id)   ON DELETE SET NULL,
  prioridad   TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('alta','media','baja')),
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historial_etapas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trabajo_id UUID NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  etapa_id   UUID REFERENCES etapas(id) ON DELETE SET NULL,
  fecha      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trabajos_etapa    ON trabajos(etapa_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_cliente  ON trabajos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_historial_trabajo ON historial_etapas(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_username ON perfiles(username);

-- ── RLS ──────────────────────────────────────────────────────
-- NOTA ACADÉMICA: acceso público para la demo.
-- En producción se restringiría por auth.uid()

ALTER TABLE perfiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_perfiles"  ON perfiles         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_etapas"    ON etapas           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_clientes"  ON clientes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_trabajos"  ON trabajos         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_historial" ON historial_etapas FOR ALL USING (true) WITH CHECK (true);

-- ── DATOS DE EJEMPLO ─────────────────────────────────────────

INSERT INTO etapas (nombre, color, orden) VALUES
  ('Pedido recibido', '#6B5CE7', 0),
  ('Diseño',          '#F5A623', 1),
  ('Producción',      '#3B82F6', 2),
  ('Entrega',         '#22C55E', 3)
ON CONFLICT DO NOTHING;

INSERT INTO clientes (nombre) VALUES
  ('Restaurante Sabor'),
  ('Boutique Elegant'),
  ('Gimnasio Power'),
  ('Café del Lago'),
  ('Panadería La Rica')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  e_pedido  UUID; e_diseno UUID; e_prod UUID; e_entrega UUID;
  c_rest UUID; c_bout UUID; c_gym UUID; c_cafe UUID; c_pan UUID;
  t1 UUID; t2 UUID; t3 UUID;
BEGIN
  SELECT id INTO e_pedido  FROM etapas  WHERE nombre = 'Pedido recibido' LIMIT 1;
  SELECT id INTO e_diseno  FROM etapas  WHERE nombre = 'Diseño'          LIMIT 1;
  SELECT id INTO e_prod    FROM etapas  WHERE nombre = 'Producción'      LIMIT 1;
  SELECT id INTO e_entrega FROM etapas  WHERE nombre = 'Entrega'         LIMIT 1;
  SELECT id INTO c_rest    FROM clientes WHERE nombre = 'Restaurante Sabor'  LIMIT 1;
  SELECT id INTO c_bout    FROM clientes WHERE nombre = 'Boutique Elegant'   LIMIT 1;
  SELECT id INTO c_gym     FROM clientes WHERE nombre = 'Gimnasio Power'     LIMIT 1;
  SELECT id INTO c_cafe    FROM clientes WHERE nombre = 'Café del Lago'      LIMIT 1;
  SELECT id INTO c_pan     FROM clientes WHERE nombre = 'Panadería La Rica'  LIMIT 1;

  INSERT INTO trabajos (nombre, cliente_id, etapa_id, prioridad, descripcion) VALUES
    ('1000 Menús plastificados', c_rest, e_pedido, 'alta', 'Menús A4 plastificados, 2 caras.')
  RETURNING id INTO t1;
  INSERT INTO historial_etapas (trabajo_id, etapa_id) VALUES (t1, e_pedido);

  INSERT INTO trabajos (nombre, cliente_id, etapa_id, prioridad, descripcion) VALUES
    ('Tags para ropa — colección verano', c_bout, e_diseno, 'media', 'Tags 5x5cm, cartón 350g.')
  RETURNING id INTO t2;
  INSERT INTO historial_etapas (trabajo_id, etapa_id) VALUES (t2, e_diseno);

  INSERT INTO trabajos (nombre, cliente_id, etapa_id, prioridad, descripcion) VALUES
    ('Banner 3x1m apertura gimnasio', c_gym, e_prod, 'alta', 'Banner PVC 13oz, full color.')
  RETURNING id INTO t3;
  INSERT INTO historial_etapas (trabajo_id, etapa_id) VALUES (t3, e_prod);

  INSERT INTO trabajos (nombre, cliente_id, etapa_id, prioridad, descripcion) VALUES
    ('Menú digital — versión verano', c_cafe, e_diseno, 'baja', 'PDF interactivo 12 páginas.');

  INSERT INTO trabajos (nombre, cliente_id, etapa_id, prioridad, descripcion) VALUES
    ('Cajas personalizadas x500', c_pan, e_entrega, 'media', 'Cajas troqueladas 20x15x10cm.');

  INSERT INTO trabajos (nombre, cliente_id, etapa_id, prioridad, descripcion) VALUES
    ('Volantes promocionales x2000', c_gym, e_pedido, 'media', 'Volantes A5, 90g, full color.');
END $$;
