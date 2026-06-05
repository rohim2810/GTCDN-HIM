INSERT INTO "user" (
  "id",
  "name",
  "email",
  "emailVerified",
  "image",
  "createdAt",
  "updatedAt"
)
VALUES (
  '4d125c3d-449f-47b8-997d-a52b9d838d4a',
  'user',
  'user@localhost',
  TRUE,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "account" (
  "id",
  "accountId",
  "providerId",
  "userId",
  "accessToken",
  "refreshToken",
  "idToken",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "scope",
  "password",
  "createdAt",
  "updatedAt"
)
VALUES (
  'f4d5a14c-91c4-4828-9738-ec6d5184b9ef',
  '4d125c3d-449f-47b8-997d-a52b9d838d4a',
  'credential',
  '4d125c3d-449f-47b8-997d-a52b9d838d4a',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '82cf1fff9987e2ef3960783e44a1ad32:7b4c026444979bc1d0e91f3ef583ec0fbb0f84e7bf4db65e386c7cc991fb56281aa31be83c1c8b1c4fc02426e5f59918595778a443c0bb4bc7346c1586c9e9b5',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
