CREATE POLICY "anon can insert organisation on register"
  ON organisations FOR INSERT
  TO anon
  WITH CHECK (true);