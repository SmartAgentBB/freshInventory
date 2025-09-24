-- ====================================================
-- Migration Script: saved_recipes -> New Recipe Sharing System
-- ====================================================

-- Step 1: Create temporary function for migration
CREATE OR REPLACE FUNCTION migrate_saved_recipes()
RETURNS VOID AS $$
DECLARE
  v_recipe RECORD;
  v_new_recipe_id UUID;
  v_existing_recipe_id UUID;
BEGIN
  -- Loop through all saved recipes
  FOR v_recipe IN
    SELECT DISTINCT ON (name, user_id) *
    FROM saved_recipes
    ORDER BY name, user_id, created_at DESC
  LOOP
    -- Check if this recipe already exists in the new recipes table
    -- (based on name and created_by user)
    SELECT id INTO v_existing_recipe_id
    FROM recipes
    WHERE name = v_recipe.name
    AND created_by = v_recipe.user_id
    LIMIT 1;

    IF v_existing_recipe_id IS NULL THEN
      -- Insert into master recipes table
      INSERT INTO recipes (
        name,
        ingredients,
        difficulty,
        cooking_time,
        instructions,
        youtube_query,
        created_by,
        is_public,
        source_type,
        created_at,
        updated_at
      ) VALUES (
        v_recipe.name,
        v_recipe.ingredients,
        -- Convert Korean difficulty to English
        CASE
          WHEN v_recipe.difficulty = '쉬움' THEN 'easy'
          WHEN v_recipe.difficulty = '어려움' THEN 'hard'
          ELSE 'medium'
        END,
        v_recipe.cooking_time,
        v_recipe.instructions,
        v_recipe.youtube_query,
        v_recipe.user_id,
        false, -- Default to private for migrated recipes
        'ai_generated', -- Assume AI generated
        v_recipe.created_at,
        v_recipe.updated_at
      )
      RETURNING id INTO v_new_recipe_id;
    ELSE
      v_new_recipe_id := v_existing_recipe_id;
    END IF;

    -- Insert into user_saved_recipes
    INSERT INTO user_saved_recipes (
      user_id,
      recipe_id,
      saved_at,
      last_viewed_at
    ) VALUES (
      v_recipe.user_id,
      v_new_recipe_id,
      v_recipe.created_at,
      v_recipe.updated_at
    )
    ON CONFLICT (user_id, recipe_id) DO NOTHING;

    -- Initialize recipe stats
    INSERT INTO recipe_stats (recipe_id, total_saves)
    VALUES (v_new_recipe_id, 1)
    ON CONFLICT (recipe_id)
    DO UPDATE SET total_saves = recipe_stats.total_saves + 1;
  END LOOP;

  -- Update all recipe statistics
  PERFORM update_recipe_stats();
END;
$$ LANGUAGE plpgsql;

-- Step 2: Run migration
DO $$
BEGIN
  -- Check if migration is needed
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_recipes') THEN
    -- Perform migration
    PERFORM migrate_saved_recipes();

    -- Log migration completion
    RAISE NOTICE 'Migration completed successfully. Migrated % recipes.',
      (SELECT COUNT(*) FROM saved_recipes);

    -- Optional: Rename old table instead of dropping (for safety)
    ALTER TABLE saved_recipes RENAME TO saved_recipes_backup;

    -- Add migration timestamp
    COMMENT ON TABLE saved_recipes_backup IS
      'Backup of original saved_recipes table. Migrated on ' || NOW()::TEXT;
  ELSE
    RAISE NOTICE 'No migration needed. saved_recipes table does not exist.';
  END IF;
END;
$$;

-- Step 3: Clean up migration function
DROP FUNCTION IF EXISTS migrate_saved_recipes();

-- Step 4: Verify migration
DO $$
DECLARE
  v_old_count INTEGER;
  v_new_count INTEGER;
BEGIN
  -- Count old records
  SELECT COUNT(*) INTO v_old_count
  FROM saved_recipes_backup;

  -- Count new records
  SELECT COUNT(*) INTO v_new_count
  FROM user_saved_recipes;

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  - Original saved_recipes: % records', v_old_count;
  RAISE NOTICE '  - New user_saved_recipes: % records', v_new_count;
  RAISE NOTICE '  - Master recipes created: % records',
    (SELECT COUNT(*) FROM recipes);
  RAISE NOTICE '  - Recipe stats initialized: % records',
    (SELECT COUNT(*) FROM recipe_stats);
END;
$$;

-- Step 5: Create view for backward compatibility (if needed)
CREATE OR REPLACE VIEW saved_recipes_view AS
SELECT
  usr.id,
  usr.user_id,
  r.name,
  r.ingredients,
  CASE
    WHEN r.difficulty = 'easy' THEN '쉬움'
    WHEN r.difficulty = 'hard' THEN '어려움'
    ELSE '보통'
  END AS difficulty,
  r.cooking_time,
  r.instructions,
  r.youtube_query,
  true AS bookmarked,
  usr.saved_at AS created_at,
  usr.last_viewed_at AS updated_at
FROM user_saved_recipes usr
JOIN recipes r ON usr.recipe_id = r.id;

-- Grant permissions on the view
GRANT SELECT ON saved_recipes_view TO authenticated;

-- Step 6: Add helpful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_recipes_name_gin ON recipes USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_user_saved_recent ON user_saved_recipes(user_id, saved_at DESC);