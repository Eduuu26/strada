# Servidor x99 (infraestructura)

Documentación del servidor de trabajo remoto.

## Acceso

| Campo | Valor |
|-------|-------|
| Hostname | `x99` |
| Tailscale IP | `100.66.89.32` |
| Usuario SSH | `sebastean` |
| AnyDesk ID | `773354590` |
| OS | Ubuntu 22.04 LTS |
| RAM | 251 GB |

### SSH (desde Windows)

```powershell
ssh x99
```

Config local: `~/.ssh/config` con alias `x99` y clave `id_ed25519`.

### AnyDesk

Conexión remota con escritorio gráfico. Contraseña de acceso desatendido configurada en el servidor.

## Almacenamiento (post-limpieza 2026-07-06)

| Montaje | Tamaño | Uso | Notas |
|---------|--------|-----|-------|
| `/` | 916 GB | ~10% | Sistema + home |
| `/mnt/M5` | 938 GB | ~0% | NVMe libre (antes: plots Chia) |

## Mantenimiento realizado

- Eliminado Chia blockchain (~1 TB: DB + 18 plots).
- Desinstalados paquetes Chia, Docker/Netdata huérfanos.
- Sistema actualizado (kernel 6.8.0-124).
- AnyDesk activo y configurado.

## Strada API (producción)

| Campo | Valor |
|-------|-------|
| Ruta en servidor | `~/strada-api/` |
| Datos persistentes | `/mnt/M5/strada-api/data` |
| Contenedores | `strada-api`, `strada-caddy` |
| Puerto interno API | `8788` |
| HTTPS público | Cloudflare Tunnel (sin dominio propio) |
| URL API actual | Ver `deploy/x99/api-url.txt` |

### Desplegar / actualizar

```powershell
cd C:\Users\Eduardo\Desktop\www\rutas-app
.\scripts\deploy-x99.ps1
```

### DNS requerido

Registro **A**: `api.strada.es` → `85.56.205.160`

Router: reenviar **80** y **443** a x99.

Scripts de mantenimiento en el servidor: `~/server-admin/scripts/`

## Tailscale

Red: `stefansebastean@gmail.com` (tailnet). El servidor aparece como `servidor-edy` / `x99` según máquina.
