export interface Migration {
  id: string
  up: string
  down: string
}

export const MIGRATIONS: Migration[] = [
  {
    id: '20250108120000_add_raw_audio_to_interactions',
    up: 'ALTER TABLE interactions ADD COLUMN raw_audio BLOB;',
    down: 'ALTER TABLE interactions DROP COLUMN raw_audio;',
  },
  {
    id: '20250108130000_add_duration_to_interactions',
    up: 'ALTER TABLE interactions ADD COLUMN duration_ms INTEGER DEFAULT 0;',
    down: 'ALTER TABLE interactions DROP COLUMN duration_ms;',
  },
  {
    id: '20250110120000_add_sample_rate_to_interactions',
    up: 'ALTER TABLE interactions ADD COLUMN sample_rate INTEGER;',
    down: 'ALTER TABLE interactions DROP COLUMN sample_rate;',
  },
  {
    id: '20250111120000_add_raw_audio_id_to_interactions',
    up: 'ALTER TABLE interactions ADD COLUMN raw_audio_id TEXT;',
    down: 'ALTER TABLE interactions DROP COLUMN raw_audio_id;',
  },
  {
    id: '20250923091139_make_dictionary_word_unique',
    up: `
      -- Delete duplicate entries, keeping only the most recent one (highest id)
      DELETE FROM dictionary_items
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM dictionary_items
        WHERE deleted_at IS NULL
        GROUP BY word
      )
      AND deleted_at IS NULL;

      -- Now create the unique index
      CREATE UNIQUE INDEX idx_dictionary_items_word_unique ON dictionary_items(word) WHERE deleted_at IS NULL;
    `,
    down: 'DROP INDEX idx_dictionary_items_word_unique;',
  },
  {
    id: '20251029000000_add_user_metadata_table',
    up: `
      CREATE TABLE user_metadata (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        paid_status TEXT NOT NULL DEFAULT 'FREE',
        free_words_remaining INTEGER,
        pro_trial_start_date TEXT,
        pro_trial_end_date TEXT,
        pro_subscription_start_date TEXT,
        pro_subscription_end_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
    down: 'DROP TABLE user_metadata;',
  },
  {
    id: '20260111000000_add_onboarding_to_user_metadata',
    up: `
      ALTER TABLE user_metadata ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
      ALTER TABLE user_metadata ADD COLUMN onboarding_step INTEGER DEFAULT 0;
    `,
    down: `
      ALTER TABLE user_metadata DROP COLUMN onboarding_completed;
      ALTER TABLE user_metadata DROP COLUMN onboarding_step;
    `,
  },
  {
    id: '20260127000000_create_today_table',
    up: `
      CREATE TABLE today (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        UNIQUE(date, user_id)
      );
      CREATE INDEX idx_today_date_user ON today(date, user_id);
      CREATE INDEX idx_today_user_deleted ON today(user_id, deleted_at);
    `,
    down: `
      DROP INDEX idx_today_user_deleted;
      DROP INDEX idx_today_date_user;
      DROP TABLE today;
    `,
  },
]
