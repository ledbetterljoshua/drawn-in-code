/* world.js — the fires that light Kilnhill and the landmarks the parts are placed around.
   Every light here is something in the world that burns: the kiln's firemouths and its chimney
   flame, the lamps inside the pot houses, the potter's workshop, the cooling bench, the burrow
   mouths. Nothing comes from the sky. Positions are artboard units; eye level is y = Kiln.HZ. */
(function () {
  const K = window.Kiln;
  // the bottle kiln stands just left of centre; everything else is placed relative to it
  K.KX = 560; K.KBASE = 864; K.KTOP = 236;
  K.L = {
    mouth: K.addLight({ id: 'mouth', x: 560, y: 846, z: 90, r: 700, col: [2.1, 0.95, 0.34] }),
    mouthL: K.addLight({ id: 'mouthL', x: 418, y: 848, z: 50, r: 320, col: [1.3, 0.52, 0.16] }),
    mouthR: K.addLight({ id: 'mouthR', x: 702, y: 848, z: 50, r: 320, col: [1.3, 0.52, 0.16] }),
    flame: K.addLight({ id: 'flame', x: 560, y: 214, z: 30, r: 440, col: [1.5, 0.68, 0.24] }),
    teapot: K.addLight({ id: 'teapot', x: 1112, y: 772, z: 120, r: 330, col: [1.05, 0.74, 0.36] }),
    shop: K.addLight({ id: 'shop', x: 884, y: 880, z: 60, r: 280, col: [1.05, 0.74, 0.38] }),
    jug: K.addLight({ id: 'jug', x: 128, y: 436, z: 90, r: 250, col: [0.85, 0.58, 0.26] }),
    lantern: K.addLight({ id: 'lantern', x: 296, y: 512, z: 90, r: 210, col: [0.8, 0.55, 0.24] }),
    bowl: K.addLight({ id: 'bowl', x: 1336, y: 878, z: 100, r: 240, col: [0.9, 0.62, 0.3] }),
    jar: K.addLight({ id: 'jar', x: 1468, y: 712, z: 80, r: 200, col: [0.8, 0.56, 0.28] }),
    bench: K.addLight({ id: 'bench', x: 1296, y: 1082, z: 60, r: 330, col: [1.15, 0.36, 0.12] }),
    post: K.addLight({ id: 'post', x: 836, y: 996, z: 90, r: 300, col: [0.95, 0.64, 0.3] }),
    burrowL: K.addLight({ id: 'burrowL', x: 96, y: 640, z: 30, r: 140, col: [0.9, 0.5, 0.2] }),
    burrowR: K.addLight({ id: 'burrowR', x: 1210, y: 952, z: 30, r: 130, col: [0.9, 0.5, 0.2] }),
    hillDoor: K.addLight({ id: 'hillDoor', x: -66, y: 846, z: 80, r: 230, col: [1, 0.66, 0.3] }),
    digger: K.addLight({ id: 'digger', x: 96, y: 862, z: 60, r: 190, col: [0.9, 0.6, 0.28] }),
    groundDoor: K.addLight({ id: 'groundDoor', x: 1040, y: 1396, z: 120, r: 330, col: [1.1, 0.72, 0.34] }),
    burrowF: K.addLight({ id: 'burrowF', x: 140, y: 1196, z: 30, r: 160, col: [0.9, 0.48, 0.2] }),
  };
})();
