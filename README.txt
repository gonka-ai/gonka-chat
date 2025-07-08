git clone git@github.com:gonka-ai/gonka-chat.git
sudo cp .env.example .env
fill out parameters in .env
OPENAI_API_KEY=
GONKA_PRIVATE_KEY=
GONKA_ENDPOINTS=
GONKA_ADDRESS=
cp librechat.example-gonka.yam librechat.yaml
check and fill out parameters in  librechat.yaml
baseURL
models
fetch
cp docker-compose.override.yml.example-gonka docker-compose.override.yml
docker compose build
docker compose up -d
reverse proxy 3080 port to the internet