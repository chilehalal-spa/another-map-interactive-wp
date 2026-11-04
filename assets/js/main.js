class Versor {
    static fromAngles([l, p, g]) {
        l *= Math.PI / 360;
        p *= Math.PI / 360;
        g *= Math.PI / 360;
        const sl = Math.sin(l), cl = Math.cos(l);
        const sp = Math.sin(p), cp = Math.cos(p);
        const sg = Math.sin(g), cg = Math.cos(g);
        return [
            cl * cp * cg + sl * sp * sg,
            sl * cp * cg - cl * sp * sg,
            cl * sp * cg + sl * cp * sg,
            cl * cp * sg - sl * sp * cg
        ];
    }

    static toAngles([a, b, c, d]) {
        return [
            Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180 / Math.PI,
            Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180 / Math.PI,
            Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180 / Math.PI
        ];
    }

    static interpolateAngles(a, b) {
        const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
        return t => Versor.toAngles(i(t));
    }

    static interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
        a2 -= a1, b2 -= b1, c2 -= c1, d2 -= d1;
        const x = new Array(4);
        return t => {
            const l = Math.hypot(x[0] = a1 + a2 * t, x[1] = b1 + b2 * t, x[2] = c1 + c2 * t, x[3] = d1 + d2 * t);
            x[0] /= l, x[1] /= l, x[2] /= l, x[3] /= l;
            return x;
        };
    }

    static interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
        let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
        if (dot < 0) a2 = -a2, b2 = -b2, c2 = -c2, d2 = -d2, dot = -dot;
        if (dot > 0.9995) return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]); 
        const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
        const x = new Array(4);
        const l = Math.hypot(a2 -= a1 * dot, b2 -= b1 * dot, c2 -= c1 * dot, d2 -= d1 * dot);
        a2 /= l, b2 /= l, c2 /= l, d2 /= l;
        return t => {
            const theta = theta0 * t;
            const s = Math.sin(theta);
            const c = Math.cos(theta);
            x[0] = a1 * c + a2 * s;
            x[1] = b1 * c + b2 * s;
            x[2] = c1 * c + c2 * s;
            x[3] = d1 * c + d2 * s;
            return x;
        };
    }
}

class WorldTourRenderer {
    constructor(containerSelector, dataUrl) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.dataUrl = dataUrl;
        this.width = this.container.clientWidth || 800;
        this.height = Math.min(this.width, 720);
        this.tilt = 20;
        this.isPlaying = true;

        this.setupDOM();
        this.loadData();
    }

    setupDOM() {
        this.nameLabel = document.createElement('h3');
        this.nameLabel.className = 'another-map-title';
        this.container.appendChild(this.nameLabel);

        const dpr = window.devicePixelRatio ?? 1;
        this.canvas = document.createElement('canvas');
        this.canvas.width = dpr * this.width;
        this.canvas.height = dpr * this.height;
        this.canvas.style.width = `${this.width}px`;
        this.container.appendChild(this.canvas);

        this.context = this.canvas.getContext("2d");
        this.context.scale(dpr, dpr);

        this.projection = d3.geoOrthographic().fitExtent([[10, 10], [this.width - 10, this.height - 10]], {type: "Sphere"});
        this.path = d3.geoPath(this.projection, this.context);
    }

    async loadData() {
        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const world = await response.json();
            
            if (!world.objects || !world.objects.countries) {
                throw new Error("Invalid TopoJSON structure");
            }

            this.countries = topojson.feature(world, world.objects.countries).features;
            this.borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
            this.land = topojson.feature(world, world.objects.land);

            this.startAnimationLoop();

        } catch (error) {
            console.error("World Tour Plugin - Data Loading Error:", error);
            this.container.innerHTML = `<p class="error-msg">Error loading map data.</p>`;
        }
    }

    drawFrame(country, arc = null) {
        this.context.clearRect(0, 0, this.width, this.height);
        
        this.context.beginPath(); this.path(this.land); this.context.fillStyle = "#ccc"; this.context.fill();
        this.context.beginPath(); this.path(country); this.context.fillStyle = "#f00"; this.context.fill();
        this.context.beginPath(); this.path(this.borders); this.context.strokeStyle = "#fff"; this.context.lineWidth = 0.5; this.context.stroke();
        this.context.beginPath(); this.path({type: "Sphere"}); this.context.strokeStyle = "#000"; this.context.lineWidth = 1.5; this.context.stroke();
        
        if (arc) {
            this.context.beginPath(); this.path(arc); this.context.stroke();
        }
    }

    async startAnimationLoop() {
        let p1, p2 = [0, 0], r1, r2 = [0, 0, 0];

        while (this.isPlaying) {
            for (const country of this.countries) {
                if (!this.isPlaying) return;

                this.nameLabel.textContent = country.properties.name || "Unknown Region";
                this.drawFrame(country);

                p1 = p2;
                p2 = d3.geoCentroid(country);
                r1 = r2;
                r2 = [-p2[0], this.tilt - p2[1], 0];
                
                const ip = d3.geoInterpolate(p1, p2);
                const iv = Versor.interpolateAngles(r1, r2);

                await d3.transition()
                    .duration(1250)
                    .tween("render", () => t => {
                        this.projection.rotate(iv(t));
                        this.drawFrame(country, {type: "LineString", coordinates: [p1, ip(t)]});
                    })
                    .transition()
                    .tween("render", () => t => {
                        this.drawFrame(country, {type: "LineString", coordinates: [ip(t), p2]});
                    })
                    .end();
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof AnotherMapConfig !== 'undefined' && AnotherMapConfig.dataUrl) {
        new WorldTourRenderer('#another-map-interactive-container', AnotherMapConfig.dataUrl);
    }
});