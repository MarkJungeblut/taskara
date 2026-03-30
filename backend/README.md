# Backend boundaries

- `backend/interfaces/api` is the delivery layer for route-facing parsing/mapping.
- `backend/application` contains use-cases, DTOs, ports, and orchestration services.
- `backend/domain` contains business models and domain services only.
- `backend/infrastructure` contains filesystem/env/chokidar/yaml adapters.
- Dependency direction: `interfaces -> application -> domain`, and `application -> infrastructure` through ports.
