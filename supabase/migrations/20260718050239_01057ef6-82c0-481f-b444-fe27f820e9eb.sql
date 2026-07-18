
INSERT INTO public.game_configs (game_key, name, is_enabled, min_bet, max_bet, house_edge, config)
VALUES
  ('chicken-road', 'Chicken Road', true, 10, 10000, 0.02, '{}'::jsonb),
  ('tower', 'Tower — Royal Step', true, 10, 10000, 0.03, '{}'::jsonb),
  ('lucky-card', 'Lucky Card', true, 10, 10000, 0.02, '{}'::jsonb),
  ('shell-game', 'Shell Game', true, 10, 10000, 0.03, '{}'::jsonb),
  ('scratch-card', 'Scratch Card', true, 10, 5000, 0.05, '{}'::jsonb),
  ('keno', 'Keno', true, 10, 5000, 0.05, '{}'::jsonb),
  ('hi-lo', 'Hi-Lo', true, 10, 10000, 0.03, '{}'::jsonb),
  ('color-prediction', 'Color Prediction', true, 10, 10000, 0.03, '{}'::jsonb)
ON CONFLICT (game_key) DO NOTHING;
