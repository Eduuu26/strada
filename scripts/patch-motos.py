# Patches app.js for motorcycle support
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")

helpers = '''
    const ROUTE_VEHICLE_MODES = [
      { id: 'mixto', label: 'Coches y motos', icon: '🚗🏍️' },
      { id: 'coches', label: 'Solo coches', icon: '🚗' },
      { id: 'motos', label: 'Solo motos', icon: '🏍️' },
    ];

    function routeVehicleModeLabel(mode) {
      return ROUTE_VEHICLE_MODES.find((m) => m.id === mode)?.label || 'Coches y motos';
    }

    function routeVehicleModeIcon(mode) {
      return ROUTE_VEHICLE_MODES.find((m) => m.id === mode)?.icon || '🚗🏍️';
    }

    function isMotoVehicle(type) {
      return type === 'moto';
    }

    function vehicleMatchesRoute(route, type) {
      const mode = route.vehicleMode || 'mixto';
      if (mode === 'mixto') return true;
      if (mode === 'motos') return isMotoVehicle(type);
      return !isMotoVehicle(type);
    }

    let createRouteVehicleMode = 'mixto';
'''

if 'ROUTE_VEHICLE_MODES' not in js:
    js = js.replace(
        "    const VEHICLES = [",
        helpers + "\n    const VEHICLES = [",
    )

js = js.replace(
    "      { id: 'coche', label: 'Coche', icon: '🚗' },\n      { id: 'deportivo', label: 'Deportivo', icon: '🏎️' },\n      { id: 'clasico', label: 'Clásico', icon: '🚙' },\n      { id: 'moto', label: 'Moto', icon: '🏍️' },",
    "      { id: 'coche', label: 'Coche', icon: '🚗' },\n      { id: 'moto', label: 'Moto', icon: '🏍️' },\n      { id: 'deportivo', label: 'Deportivo', icon: '🏎️' },\n      { id: 'clasico', label: 'Clásico', icon: '🚙' },",
)

js = js.replace(
    "      { id: 'all', label: 'Todas' },\n      { id: 'andalucia', label: 'Andalucía' },",
    "      { id: 'all', label: 'Todas' },\n      { id: 'motos', label: '🏍️ Motos' },\n      { id: 'coches', label: '🚗 Coches' },\n      { id: 'andalucia', label: 'Andalucía' },",
)

js = js.replace(
    """      if (routeFilterId === 'exigente') return level.includes('exigente');
      return true;""",
    """      if (routeFilterId === 'exigente') return level.includes('exigente');
      if (routeFilterId === 'motos') {
        const mode = route.vehicleMode || 'mixto';
        return mode === 'motos' || mode === 'mixto';
      }
      if (routeFilterId === 'coches') {
        const mode = route.vehicleMode || 'mixto';
        return mode === 'coches' || mode === 'mixto';
      }
      return true;""",
)

# Add vehicleMode to seed routes - mixto default on existing
for rid, mode in [
    ("ronda", "mixto"), ("picos", "mixto"), ("madrid", "mixto"), ("cabo-gata", "mixto"),
    ("montseny", "motos"), ("tramuntana", "motos"),
]:
    needle = f"id: '{rid}'"
    if needle in js and f"vehicleMode" not in js[js.index(needle):js.index(needle)+400]:
        js = js.replace(
            f"id: '{rid}', title:",
            f"id: '{rid}', vehicleMode: '{mode}', title:",
            1,
        )

moto_routes = """
      { id: 'guadarrama-moto', vehicleMode: 'motos', title: 'Puerto de Navacerrada en moto', region: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80', desc: 'Subida clásica desde la sierra madrileña pensada para motos. Curvas de montaña, ritmo ágil y parada en el puerto.', km: 48, min: 70, level: 'media', stops: ['Miraflores de la Sierra', 'Puerto de Navacerrada'], meetingAt: '2026-07-19T08:00:00+02:00', meetingPoint: 'Miraflores — plaza principal', meetingLat: 40.8136, meetingLng: -3.7683, maxAttendees: 16, creatorName: 'Laura M.', creatorEmail: 'laura@strada.es', path: [[40.8136,-3.7683],[40.7417,-4.0042]], navInstruction: 'Sube hacia el puerto de Navacerrada', navNextKm: 7.5 },
      { id: 'n260-moto', vehicleMode: 'motos', title: 'N-260 · Pirineo en moto', region: 'Huesca · Aragón', coverImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80', desc: 'Tramos de curvas infinitas por el Pirineo aragonés. Ruta solo motos con paradas en miradores y gasolinera pactada a mitad de ruta.', km: 124, min: 150, level: 'exigente', stops: ['Aínsa', 'Escalona', 'Biescas'], meetingAt: '2026-08-16T09:00:00+02:00', meetingPoint: 'Plaza de Aínsa', meetingLat: 42.4156, meetingLng: 0.1401, maxAttendees: 12, creatorName: 'Miguel S.', creatorEmail: 'miguel@strada.es', path: [[42.4156,0.1401],[42.3889,0.0892],[42.6311,-0.2189]], navInstruction: 'Sigue la N-260 hacia Biescas', navNextKm: 11.0 },
"""

if 'guadarrama-moto' not in js:
    js = js.replace(
        "      { id: 'tramuntana', title:",
        "      { id: 'tramuntana', vehicleMode: 'motos', title:",
        1,
    )
    js = js.replace(
        "      { id: 'montseny', title:",
        "      { id: 'montseny', vehicleMode: 'motos', title:",
        1,
    )
    js = js.replace(
        "    ];",
        moto_routes + "    ];",
        1,
    )

moto_post = """      { id: 'post_seed_5', authorEmail: 'pedro@strada.es', authorName: 'Pedro L.', imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80', caption: 'Domingo de curvas con la MT-07 por el Montseny. La carretera estaba seca y el grupo perfecto 🏍️', routeTitle: 'Curvas del Montseny', vehicleLabel: 'Yamaha MT-07', createdAt: '2026-06-24T10:15:00+02:00', likes: ['carlos@strada.es', 'laura@strada.es'], comments: [], seed: true },
"""
if 'post_seed_5' not in js:
    js = js.replace("      { id: 'post_seed_4',", moto_post + "      { id: 'post_seed_4',", 1)

js = js.replace(
    """      const tags = [route.region.split(' ·')[0]];
      if (route.meetingAt) tags.push(`${count}/${route.maxAttendees || '∞'} apuntados`);

      return `<article class="route-card community" data-route-id="${route.id}">
        <div class="route-cover">
          <img src="${getRouteCover(route)}" alt="Vista previa de ${route.title}" loading="lazy">
          <span class="route-level tag ${levelTagClass(route.level)}">${route.level}</span>
        </div>""",
    """      const tags = [route.region.split(' ·')[0], routeVehicleModeLabel(route.vehicleMode)];
      if (route.meetingAt) tags.push(`${count}/${route.maxAttendees || '∞'} apuntados`);
      const mode = route.vehicleMode || 'mixto';

      return `<article class="route-card community" data-route-id="${route.id}">
        <div class="route-cover">
          <img src="${getRouteCover(route)}" alt="Vista previa de ${route.title}" loading="lazy">
          <span class="route-vehicle-badge">${routeVehicleModeIcon(mode)} ${routeVehicleModeLabel(mode)}</span>
          <span class="route-level tag ${levelTagClass(route.level)}">${route.level}</span>
        </div>""",
)

js = js.replace(
    "<p class=\"hero-text\">Organiza: <strong>${r.creatorName || 'Comunidad'}</strong></p>",
    "<p class=\"hero-text\">Organiza: <strong>${r.creatorName || 'Comunidad'}</strong> · ${routeVehicleModeIcon(r.vehicleMode)} ${routeVehicleModeLabel(r.vehicleMode)}</p>",
)

js = js.replace(
    """        noVehiclesEl.hidden = true;
        const defaultVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
        selectedSavedVehicleId = defaultVehicle.id;
        listEl.innerHTML = vehicles.map((v) =>""",
    """        const route = getRoute(routeId);
        const compatible = vehicles.filter((v) => vehicleMatchesRoute(route, v.type));
        if (!compatible.length) {
          noVehiclesEl.hidden = false;
          noVehiclesEl.innerHTML = `Esta ruta es <strong>${routeVehicleModeLabel(route.vehicleMode)}</strong>. Añade un vehículo compatible en tu perfil.
              <button type="button" class="btn btn-secondary btn-sm" id="joinGoProfile" style="margin-top:10px">Ir a mi perfil</button>`;
          listEl.innerHTML = '';
          selectedSavedVehicleId = null;
          confirmBtn.disabled = true;
          document.getElementById('joinGoProfile').onclick = () => {
            closeJoinModal();
            showTab('profile');
          };
        } else {
        noVehiclesEl.hidden = true;
        const defaultVehicle = compatible.find((v) => v.isDefault) || compatible[0];
        selectedSavedVehicleId = defaultVehicle.id;
        listEl.innerHTML = compatible.map((v) =>""",
)

js = js.replace(
    """        confirmBtn.disabled = false;
      }

      document.getElementById('joinModal').classList.add('open');""",
    """        confirmBtn.disabled = false;
        }
      }

      document.getElementById('joinModal').classList.add('open');""",
)

js = js.replace(
    "if (!picked) return showError(document.getElementById('joinError'), 'Elige un vehículo de tu perfil.');",
    """if (!picked) return showError(document.getElementById('joinError'), 'Elige un vehículo de tu perfil.');
      const joinRoute = getRoute(routeId);
      if (joinRoute && !vehicleMatchesRoute(joinRoute, picked.type)) {
        return showError(document.getElementById('joinError'), `Esta ruta es ${routeVehicleModeLabel(joinRoute.vehicleMode)}. Elige un vehículo compatible.`);
      }""",
)

js = js.replace(
    "creatorEmail: currentUser.email,\n      });",
    "creatorEmail: currentUser.email,\n        vehicleMode: createRouteVehicleMode,\n      });",
)

if 'bindCreateRouteVehicleMode' not in js:
    js = js.replace(
        "function openCreateRouteModal() {",
        """function bindCreateRouteVehicleMode() {
      const wrap = document.getElementById('crVehicleMode');
      if (!wrap || wrap.dataset.bound === '1') return;
      wrap.dataset.bound = '1';
      wrap.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.onclick = () => {
          createRouteVehicleMode = btn.dataset.mode;
          wrap.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === createRouteVehicleMode));
        };
      });
    }

    function openCreateRouteModal() {""",
    )
    js = js.replace(
        "document.getElementById('createRouteModal').classList.add('open');",
        "createRouteVehicleMode = 'mixto';\n      bindCreateRouteVehicleMode();\n      document.querySelectorAll('#crVehicleMode [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'mixto'));\n      document.getElementById('createRouteModal').classList.add('open');",
    )

js = js.replace("Rutas en coche", "Coches y motos")
js = js.replace("rutas y coches", "rutas, coches y motos")
js = js.replace("tu coche", "tu vehículo")
js = js.replace("el coche,", "tu coche o moto,")
js = js.replace("placeholder=\"Ej. Golf GTI, Porsche 911…\"", "placeholder=\"Ej. Golf GTI, Yamaha MT-07…\"")

(ROOT / "assets/js/app.js").write_text(js, encoding="utf-8")
print("patched motos in app.js")
