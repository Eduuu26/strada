# Versionado y releases

## Esquema

Usamos **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

| Tipo | Cuándo | Ejemplo |
|------|--------|---------|
| **MAJOR** | Cambios incompatibles en API o app | `2.0.0` |
| **MINOR** | Funcionalidad nueva compatible | `1.1.0` |
| **PATCH** | Correcciones de bugs | `1.0.1` |

La versión oficial está en `package.json` → campo `"version"`.

## Flujo de trabajo

### 1. Desarrollo en `main`

```powershell
git checkout main
git pull
# ... cambios ...
npm run test:all
git add .
git commit -m "feat: descripción del cambio"
git push
```

### 2. Actualizar changelog

Edita `CHANGELOG.md` bajo `## [Unreleased]` o crea la sección de la nueva versión.

### 3. Crear release

```powershell
# Actualizar versión en package.json (ej. 1.1.0)
npm version minor -m "Release v%s"

git push
git push --tags

# Release en GitHub con notas
gh release create v1.1.0 --title "v1.1.0" --notes-file CHANGELOG.md
```

### 4. Tags existentes

```powershell
git tag -l
git show v1.0.0
```

## Convención de commits (recomendada)

| Prefijo | Uso |
|---------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Solo documentación |
| `chore:` | Mantenimiento, deps |
| `test:` | Pruebas |

## CI

Cada push a `main` ejecuta `npm run test:all` (ver `.github/workflows/ci.yml`).
