const { Sequelize } = require('sequelize');
const pg = require('pg');
require('dotenv').config();

const DB_NAME = process.env.POSTGRES_DATABASE || process.env.PGDATABASE || process.env.DB_NAME;
const DB_USER = process.env.POSTGRES_USER || process.env.PGUSER || process.env.DB_USER;
const DB_PASSWORD = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.DB_PASSWORD;
const DB_HOST = process.env.POSTGRES_HOST || process.env.PGHOST || process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432);

const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL_UNPOOLED;

let sequelize;
if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

async function initDb() {
  try {
    await sequelize.authenticate();
    // Conversión inline de columnas existentes a arreglos antes del sync
    // - pymes.tipo_servicio: TEXT -> TEXT[]
    // - pymes.tipo_atencion: ENUM -> ENUM[] (manteniendo valores 'Presencial', 'A Domicilio', 'Online')
    await sequelize.query(`
DO $$
BEGIN
  -- Convertir tipo_servicio (TEXT -> TEXT[])
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pymes'
      AND column_name = 'tipo_servicio'
      AND data_type <> 'ARRAY'
  ) THEN
    ALTER TABLE "public"."pymes"
      ALTER COLUMN "tipo_servicio" DROP NOT NULL,
      ALTER COLUMN "tipo_servicio" DROP DEFAULT,
      ALTER COLUMN "tipo_servicio" TYPE text[]
      USING CASE
        WHEN "tipo_servicio" IS NULL OR "tipo_servicio" = '' THEN ARRAY[]::text[]
        ELSE ARRAY["tipo_servicio"]::text[]
      END;
  END IF;

  -- Asegurar tipo ENUM y convertir tipo_atencion (ENUM -> ENUM[])
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pymes'
      AND column_name = 'tipo_atencion'
      AND data_type <> 'ARRAY'
  ) THEN
    BEGIN
      CREATE TYPE "public"."enum_pymes_tipo_atencion" AS ENUM ('Presencial', 'A Domicilio', 'Online');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    ALTER TABLE "public"."pymes"
      ALTER COLUMN "tipo_atencion" DROP NOT NULL,
      ALTER COLUMN "tipo_atencion" DROP DEFAULT,
      ALTER COLUMN "tipo_atencion" TYPE "public"."enum_pymes_tipo_atencion"[]
      USING CASE
        WHEN "tipo_atencion" IS NULL THEN ARRAY[]::"public"."enum_pymes_tipo_atencion"[]
        ELSE ARRAY["tipo_atencion"]::"public"."enum_pymes_tipo_atencion"[]
      END;
  END IF;

  -- Convertir etiquetas (TEXT -> JSONB)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pymes'
      AND column_name = 'etiquetas'
      AND data_type <> 'jsonb'
  ) THEN
    ALTER TABLE "public"."pymes"
      ALTER COLUMN "etiquetas" DROP NOT NULL,
      ALTER COLUMN "etiquetas" DROP DEFAULT,
      ALTER COLUMN "etiquetas" TYPE jsonb
      USING CASE
        WHEN "etiquetas" IS NULL THEN NULL
        ELSE to_jsonb("etiquetas")
      END;
  END IF;

  -- Convertir redes (TEXT -> JSONB)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pymes'
      AND column_name = 'redes'
      AND data_type <> 'jsonb'
  ) THEN
    ALTER TABLE "public"."pymes"
      ALTER COLUMN "redes" DROP NOT NULL,
      ALTER COLUMN "redes" DROP DEFAULT,
      ALTER COLUMN "redes" TYPE jsonb
      USING CASE
        WHEN "redes" IS NULL THEN NULL
        ELSE to_jsonb("redes")
      END;
  END IF;
END $$;
`);
    // Sync sin alter para evitar casts erróneos en ENUM[] generados por Sequelize
    await sequelize.sync();
    console.log('DB conectada:', DB_HOST + ':' + DB_PORT, 'DB:', DB_NAME);
  } catch (err) {
    console.error('Error inicializando DB', err);
    throw err;
  }
}

module.exports = { sequelize, initDb };
