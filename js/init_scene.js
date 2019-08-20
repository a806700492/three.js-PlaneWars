        function frame_init() {
            var requestAnimationFrame = window.requestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.msRequestAnimationFrame;
            window.requestAnimationFrame = requestAnimationFrame;
        }


        function stats_init() {
            stats = new Stats();
            stats.setMode(1); // 0: fps, 1: ms
            // 将stats的界面对应左上角
            stats.domElement.style.position = 'absolute';
            stats.domElement.style.left = '0px';
            stats.domElement.style.top = '0px';
            document.body.appendChild(stats.domElement);
        }

        function createScene() {
            // Get the width and the height of the screen,
            // use them to set up the aspect ratio of the camera
            // and the size of the renderer.
            HEIGHT = window.innerHeight;
            WIDTH = window.innerWidth;

            // Create the scene
            scene = new THREE.Scene();

            // Add a fog effect to the scene; same color as the
            // background color used in the style sheet
            scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

            // Create the camera
            aspectRatio = WIDTH / HEIGHT;
            fieldOfView = 60;
            nearPlane = 1;
            farPlane = 10000;

            /**
             * PerspectiveCamera 透视相机
             * @param fieldOfView 视角
             * @param aspectRatio 纵横比
             * @param nearPlane 近平面
             * @param farPlane 远平面
             */
            camera = new THREE.PerspectiveCamera(
                fieldOfView,
                aspectRatio,
                nearPlane,
                farPlane
            );

            // Set the position of the camera
            camera.position.x = 0;
            camera.position.z = 200;
            camera.position.y = 100;

            // Create the renderer
            renderer = new THREE.WebGLRenderer({
                // Allow transparency to show the gradient background
                // we defined in the CSS
                alpha: true,

                // Activate the anti-aliasing; this is less performant,
                // but, as our project is low-poly based, it should be fine :)
                antialias: true
            });

            // Define the size of the renderer; in this case,
            // it will fill the entire screen
            renderer.setSize(WIDTH, HEIGHT);
            // renderer.setClearColor(0xf7d9aa);
            // Enable shadow rendering
            renderer.shadowMap.enabled = true;

            // Add the DOM element of the renderer to the
            // container we created in the HTML
            container = document.getElementById('world');
            container.appendChild(renderer.domElement);

            // Listen to the screen: if the user resizes it
            // we have to update the camera and the renderer size
            //   window.addEventListener('resize', handleWindowResize, false);
        }

        function createLights() {
            //半球光是渐变色光；
            //第一个参数是天空颜色，第二个参数是地面颜色，
            //第三个参数是光的强度
            hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

            //定向光从特定方向发出。
            //它的作用类似于太阳，这意味着产生的所有光线都是平行的。
            shadowLight = new THREE.DirectionalLight(0xffffff, .9);

            // Set the direction of the light  
            shadowLight.position.set(150, 350, 350);

            // Allow shadow casting 
            shadowLight.castShadow = true;

            // define the visible area of the projected shadow
            shadowLight.shadow.camera.left = -400;
            shadowLight.shadow.camera.right = 400;
            shadowLight.shadow.camera.top = 400;
            shadowLight.shadow.camera.bottom = -400;
            shadowLight.shadow.camera.near = 1;
            shadowLight.shadow.camera.far = 1000;

            // define the resolution of the shadow; the higher the better, 
            // but also the more expensive and less performant
            shadowLight.shadow.mapSize.width = 2048;
            shadowLight.shadow.mapSize.height = 2048;

            // to activate the lights, just add them to the scene
            scene.add(hemisphereLight);
            scene.add(shadowLight);
        }

        function Cloud() {
            // Create an empty container that will hold the different parts of the cloud
            this.mesh = new THREE.Object3D();

            // create a cube geometry;
            // this shape will be duplicated to create the cloud
            var geom = new THREE.BoxGeometry(20, 20, 20);

            // create a material; a simple white material will do the trick
            var mat = new THREE.MeshPhongMaterial({
                color: Colors.white,
            });

            // duplicate the geometry a random number of times
            var nBlocs = 3 + Math.floor(Math.random() * 3);
            for (var i = 0; i < nBlocs; i++) {

                // create the mesh by cloning the geometry
                var m = new THREE.Mesh(geom, mat);

                // set the position and the rotation of each cube randomly
                m.position.x = i * 15;
                m.position.y = Math.random() * 10;
                m.position.z = Math.random() * 10;
                m.rotation.z = Math.random() * Math.PI * 2;
                m.rotation.y = Math.random() * Math.PI * 2;

                // set the size of the cube randomly
                var s = .1 + Math.random() * .9;
                m.scale.set(s, s, s);

                // allow each cube to cast and to receive shadows
                m.castShadow = true;
                m.receiveShadow = true;

                // add the cube to the container we first created
                this.mesh.add(m);
            }
        }

        function Sky() {
            // Create an empty container
            this.mesh = new THREE.Object3D();

            // choose a number of clouds to be scattered in the sky
            this.nClouds = 20;

            // To distribute the clouds consistently,
            // we need to place them according to a uniform angle
            var stepAngle = Math.PI * 2 / this.nClouds;
            // create the clouds
            for (var i = 0; i < this.nClouds; i++) {
                var c = new Cloud();

                // set the rotation and the position of each cloud;
                // for that we use a bit of trigonometry
                var a = stepAngle * i; // this is the final angle of the cloud

                var h = 750 + Math.random() *
                    200; // this is the distance between the center of the axis and the cloud itself

                // Trigonometry!!! I hope you remember what you've learned in Math :)
                // in case you don't: 
                // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
                c.mesh.position.y = Math.sin(a) * h;
                c.mesh.position.x = Math.cos(a) * h;

                // rotate the cloud according to its position
                c.mesh.rotation.z = a + Math.PI / 2;

                // for a better result, we position the clouds 
                // at random depths inside of the scene
                c.mesh.position.z = -400 - Math.random() * 400;

                // we also set a random scale for each cloud
                var s = 1 + Math.random() * 2;
                c.mesh.scale.set(s, s, s);

                // do not forget to add the mesh of each cloud in the scene
                this.mesh.add(c.mesh);
            }
        }



        function sea() {
            var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

            // rotate the geometry on the x axis
            geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
            geom.mergeVertices();

            var l = geom.vertices.length;

            // create an array to store new data associated to each vertex
            this.waves = [];
            for (var i = 0; i < l; i++) {
                // get each vertex
                var v = geom.vertices[i];

                // store some data associated to it
                this.waves.push({
                    y: v.y,
                    x: v.x,
                    z: v.z,
                    // a random angle
                    ang: Math.random() * Math.PI * 2,
                    // a random distance
                    amp: 5 + Math.random() * 15,
                    // a random speed between 0.016 and 0.048 radians / frame
                    speed: 0.016 + Math.random() * 0.032
                });
            };

            // create the material
            var mat = new THREE.MeshPhongMaterial({
                color: Colors.blue,
                transparent: true,
                opacity: .8,
                flatShading: THREE.FlatShading,
            });

            // To create an object in Three.js, we have to create a mesh
            // which is a combination of a geometry and some material
            this.mesh = new THREE.Mesh(geom, mat);

            // Allow the sea to receive shadows
            this.mesh.receiveShadow = true;
        }

        sea.prototype.moveWaves = function () {

            // get the vertices
            var verts = this.mesh.geometry.vertices;
            var l = verts.length;

            for (var i = 0; i < l; i++) {
                var v = verts[i];

                // get the data associated to it
                var vprops = this.waves[i];

                // update the position of the vertex
                v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
                v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

                // // increment the angle for the next frame
                vprops.ang += vprops.speed;
            }

            // Tell the renderer that the geometry of the sea has changed.
            // In fact, in order to maintain the best level of performance, 
            // three.js caches the geometries and ignores any changes
            // unless we add this line
            this.mesh.geometry.verticesNeedUpdate = true;

            sea_my.mesh.rotation.z += .005;
        }

        function AirPlane() {

            this.mesh = new THREE.Object3D();
            this.lifeValue = 100;
            this.power = 0;
            this.cover = 0;
            // Create the cabin
            var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
            var matCockpit = new THREE.MeshPhongMaterial({
                color: Colors.red,
                flatShading: THREE.FlatShading
            });
            var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
            cockpit.castShadow = true;
            cockpit.receiveShadow = true;
            this.mesh.add(cockpit);

            // Create the engine
            var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
            var matEngine = new THREE.MeshPhongMaterial({
                color: Colors.white,
                flatShading: THREE.FlatShading
            });
            var engine = new THREE.Mesh(geomEngine, matEngine);
            engine.position.x = 40;
            engine.castShadow = true;
            engine.receiveShadow = true;
            this.mesh.add(engine);

            // Create the tail
            var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
            var matTailPlane = new THREE.MeshPhongMaterial({
                color: Colors.red,
                flatShading: THREE.FlatShading
            });
            var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
            tailPlane.position.set(-35, 25, 0);
            tailPlane.castShadow = true;
            tailPlane.receiveShadow = true;
            this.mesh.add(tailPlane);

            // Create the wing
            var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
            var matSideWing = new THREE.MeshPhongMaterial({
                color: Colors.red,
                flatShading: THREE.FlatShading
            });
            var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
            sideWing.castShadow = true;
            sideWing.receiveShadow = true;
            this.mesh.add(sideWing);

            // propeller
            var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
            var matPropeller = new THREE.MeshPhongMaterial({
                color: Colors.brown,
                flatShading: THREE.FlatShading
            });
            this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
            this.propeller.castShadow = true;
            this.propeller.receiveShadow = true;

            // blades
            var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
            var matBlade = new THREE.MeshPhongMaterial({
                color: Colors.brownDark,
                flatShading: THREE.FlatShading
            });

            var blade = new THREE.Mesh(geomBlade, matBlade);
            blade.position.set(8, 0, 0);
            blade.castShadow = true;
            blade.receiveShadow = true;
            this.propeller.add(blade);
            this.propeller.position.set(50, 0, 0);
            this.mesh.add(this.propeller);

            var weapon = new THREE.CylinderGeometry(10, 10, 30, 18, 3);
            var weaponColor = new THREE.MeshPhongMaterial({
                color: Colors.white,
                flatShading: THREE.FlatShading
            });

            this.weaponBox = new THREE.Mesh(weapon, weaponColor);
            this.weaponBox.castShadow = true;
            this.weaponBox.receiveShadow = true;
            this.mesh.add(this.weaponBox);
            this.weaponBox.position.set(0, -15, 50)
            this.weaponBox.rotation.z = -90 * Math.PI / 180

            this.weaponBox2 = new THREE.Mesh(weapon, weaponColor);
            this.weaponBox2.castShadow = true;
            this.weaponBox2.receiveShadow = true;
            this.mesh.add(this.weaponBox2);
            this.weaponBox2.position.set(0, -15, -50)
            this.weaponBox2.rotation.z = -90 * Math.PI / 180

            this.mesh.position.set(-50, 100, 0)
        };

        AirPlane.prototype.auto = function () {
            if (arrEnemy.length > 0) {
                let x1 = _this.mesh.position.x,
                    y1 = _this.mesh.position.y,
                    x2 = arrEnemy[0].mesh.position.x,
                    y2 = arrEnemy[0].mesh.position.y;

                //斜率
                k = (y1 - y2) / (x1 - x2)

                //弧度
                c = Math.atan(k)

                //弧度转角度
                let z = c * 180 / Math.PI

                _this.weaponBox.rotation.z = -90 * Math.PI / 180 + c
                _this.weaponBox2.rotation.z = -90 * Math.PI / 180 + c
            } else {
                _this.weaponBox.rotation.z = -90 * Math.PI / 180
                _this.weaponBox2.rotation.z = -90 * Math.PI / 180
            }
        }

        AirPlane.prototype.death = function () {
            let _this = this;
            let times = null;

            function death_loop() {

                times = requestAnimationFrame(death_loop);

                if (_this.lifeValue <= 0) {
                    window.removeEventListener('click', handClick, false);
                    window.removeEventListener('mousemove', handleMouseMove, false);
                    airplane.mesh.position.x += 1;
                    airplane.mesh.position.y -= 1.5;
                    airplane.mesh.rotation.z -= .01;

                    if (airplane.mesh.position.y < 0) {
                        scene.remove(airplane.mesh);
                        cancelAnimationFrame(times);
                    }
                }
            }

            death_loop();
        }

        AirPlane.prototype.down = function () {
            window.removeEventListener('mousemove', handleMouseMove, false);
            let num = 0,
                timer = null,
                speed = 0.1;

            function down() {
                timer = requestAnimationFrame(down);
                mousePos.y -= speed;
                num += 0.1;

                if (num >= 0.6) {
                    speed = -0.1;
                }

                if (num > 1.2) {
                    cancelAnimationFrame(timer);
                    window.addEventListener('mousemove', handleMouseMove, false);
                }
            }

            down();
        }

        /**
         * 防护罩方法
         * @property {method} shields
         */
        AirPlane.prototype.shields = function () {
            let bol = 0,
                timer = null,
                _this = this,
                s = new THREE.SphereGeometry(80, 18, 12),
                color = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    wireframe: true,
                    opacity: .5,
                }),
                box = new THREE.Mesh(s, color);

            this.mesh.add(box);
            this.cover = 1;

            setTimeout(() => {
                timer = setInterval(() => {
                    if (bol % 2 === 0) {
                        _this.mesh.add(box);

                    } else if (bol > 10) {
                        _this.cover = 0;
                        _this.mesh.remove(box);
                        clearInterval(timer);
                        q_time.start()
                        q_i.style.display = 'none'
                    } else {
                        _this.mesh.remove(box);
                    }

                    bol += 1;
                }, 300);
            }, 5000)
        }

        AirPlane.prototype.shockWave = function () {
            let i = 1,
                k = 1,
                timer = null,
                _this = this;

            boom1.scale.set(0, 0, 0);
            boom1.material.opacity = 1;
            boom1.position.set(0, 100, 0)
            enemyMeshAry.push(boom1)

            boom2.scale.set(1, 1, 1);
            boom2.position.set(0, 100, 0)
            enemyMeshAry.push(boom2)
            scene.add(boom2)

            function big() {
                timer = requestAnimationFrame(big);

                if (k <= 0) {
                    scene.remove(boom2);
                    scene.add(boom1)
                    i += 0.3;
                    boom1.scale.set(i, i, 1);

                } else {
                    k -= 0.01
                    boom2.scale.set(k, k, 1);
                    boom2.rotation.z += 0.1;
                }

                if (i >= 25) {
                    boom1.material.opacity -= 0.05;

                    if (boom1.material.opacity <= 0) {
                        cancelAnimationFrame(timer);
                        enemyMeshAry.length = 0;
                        scene.remove(boom1);
                    }
                }
            }

            big();
        }

        /**
         * 敌机
         * @method Enemy
         */
        function Enemy() {
            this.mesh = new THREE.Object3D();
            this.lifeValue = 10;
            this.number = enemyNumber++;
            // Create the cabin
            var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
            var matCockpit = new THREE.MeshPhongMaterial({
                color: Colors.blue,
                flatShading: THREE.FlatShading
            });
            var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
            cockpit.castShadow = true;
            cockpit.receiveShadow = true;
            this.mesh.add(cockpit);

            // Create the engine
            var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
            var matEngine = new THREE.MeshPhongMaterial({
                color: Colors.white,
                flatShading: THREE.FlatShading
            });
            var engine = new THREE.Mesh(geomEngine, matEngine);
            engine.position.x = 40;
            engine.castShadow = true;
            engine.receiveShadow = true;
            this.mesh.add(engine);

            // Create the tail
            var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
            var matTailPlane = new THREE.MeshPhongMaterial({
                color: Colors.blue,
                flatShading: THREE.FlatShading
            });
            var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
            tailPlane.position.set(-35, 25, 0);
            tailPlane.castShadow = true;
            tailPlane.receiveShadow = true;
            this.mesh.add(tailPlane);

            // Create the wing
            var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
            var matSideWing = new THREE.MeshPhongMaterial({
                color: Colors.blue,
                flatShading: THREE.FlatShading
            });
            var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
            sideWing.castShadow = true;
            sideWing.receiveShadow = true;
            this.mesh.add(sideWing);

            // propeller
            var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
            var matPropeller = new THREE.MeshPhongMaterial({
                color: Colors.brown,
                flatShading: THREE.FlatShading
            });
            this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
            this.propeller.castShadow = true;
            this.propeller.receiveShadow = true;

            // blades
            var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
            var matBlade = new THREE.MeshPhongMaterial({
                color: Colors.brownDark,
                flatShading: THREE.FlatShading
            });

            var blade = new THREE.Mesh(geomBlade, matBlade);
            blade.position.set(8, 0, 0);
            blade.castShadow = true;
            blade.receiveShadow = true;
            this.propeller.add(blade);
            this.propeller.position.set(50, 0, 0);
            this.mesh.add(this.propeller);

            var weapon = new THREE.CylinderGeometry(10, 10, 30, 18, 3);
            var weaponColor = new THREE.MeshPhongMaterial({
                color: Colors.white,
                flatShading: THREE.FlatShading
            });

            this.weaponBox = new THREE.Mesh(weapon, weaponColor);
            this.weaponBox.castShadow = true;
            this.weaponBox.receiveShadow = true;
            this.mesh.add(this.weaponBox);
            this.weaponBox.position.set(0, -15, 50);
            this.weaponBox.rotation.z = -90 * Math.PI / 180;

            this.weaponBox2 = new THREE.Mesh(weapon, weaponColor);
            this.weaponBox2.castShadow = true;
            this.weaponBox2.receiveShadow = true;
            this.mesh.add(this.weaponBox2);
            this.weaponBox2.position.set(0, -15, -50);
            this.weaponBox2.rotation.z = -90 * Math.PI / 180;
        }

        Enemy.prototype.death = function (num) {
            let _this = this,
                times = null,
                speed = .4,
                times2 = 0;

            function death_loop() {
                times = requestAnimationFrame(death_loop);
                _this.propeller.rotation.x += .4;
                _this.mesh.position.y += speed;

                if (_this.mesh.position.x > num) {
                    _this.mesh.position.x -= 2
                } else if (_this.mesh.position.y >= 175) {
                    speed = -.4;
                } else if (_this.mesh.position.y <= 25) {
                    speed = .4;
                }

                if (_this.lifeValue <= 0) {
                    _this.mesh.position.x -= 1;
                    _this.mesh.position.y -= 1.5;
                    _this.mesh.rotation.z -= .01;

                    if (_this.mesh.position.y < 0) {
                        scene.remove(_this.mesh);
                        arrEnemy = arrEnemy.filter(item => item.number != _this.number);
                        cancelAnimationFrame(times);
                    }
                }

            }

            function death_loop2() {
                times2 = requestAnimationFrame(death_loop2)
                if (enemyMeshAry.length > 0) {
                    let originPoint = _this.mesh.position.clone();
                    for (let i = 0; i < _this.mesh.children.length; i++) {
                        let child = _this.mesh.children[i]
                        for (let vertexIndex = 0; vertexIndex < child.geometry.vertices.length; vertexIndex++) {
                            // 顶点原始坐标
                            let localVertex = child.geometry.vertices[vertexIndex].clone();
                            // 顶点经过变换后的坐标
                            let globalVertex = localVertex.applyMatrix4(_this.mesh.matrix);
                            // 获得由中心指向顶点的向量
                            let directionVector = globalVertex.sub(_this.mesh.position);
                            // 将方向向量初始化,并发射光线
                            let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
                            // 检测射线与多个物体的相交情况
                            // 如果为true，它还检查所有后代。否则只检查该对象本身。缺省值为false
                            let collisionResults = ray.intersectObjects(enemyMeshAry, true);
                            // 如果返回结果不为空，且交点与射线起点的距离小于物体中心至顶点的距离，则发生了碰撞
                            if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                                _this.lifeValue -= 50;
                                cancelAnimationFrame(times2)
                                return false
                            }
                        }
                    }
                }
            }
            
            death_loop2()
            death_loop();
        }


        Enemy.prototype.bullet_move = function () {
            let _this = this;
            let timer = setInterval(() => {
                if (state === 1) {
                    return false
                }
                let a = new Bullet(_this.mesh.position.x - 15, _this.mesh.position.y, 90 * Math.PI / 180, 0);
                a.move(-3, 1)
                scene.add(a.mesh);
                arr.push(a);

                setTimeout(() => {
                    let a2 = new Bullet(_this.mesh.position.x - 15, _this.mesh.position.y, 90 * Math.PI / 180, 0);
                    a2.move(-3, 1);
                    scene.add(a2.mesh);
                    arr.push(a2);
                }, 150)

                setTimeout(() => {
                    let a3 = new Bullet(_this.mesh.position.x - 15, _this.mesh.position.y, 90 * Math.PI / 180, 0);
                    a3.move(-3, 1);
                    scene.add(a3.mesh);
                    arr.push(a3);
                }, 300)

                if (_this.lifeValue <= 0) {
                    clearInterval(timer);
                }
            }, 2000);
        }

        /**
         * 子弹类
         * @method Bullet
         * 
         * @param {number} x 子弹发射点x值
         * @param {number} y 子弹发射点y值
         * @param {number} z 子弹发射点z值
         * @param {number} rot 发射的正反方向
         */
        function Bullet(x, y, z, rot) {
            this.mesh = new THREE.Object3D();
            this.num = num;

            let weapon = new THREE.CylinderGeometry(0.5, 2, 5, 18, 3);
            let weaponColor = new THREE.MeshPhongMaterial({
                color: Colors.white,
                flatShading: THREE.FlatShading
            });

            this.weaponBox = new THREE.Mesh(weapon, weaponColor);
            this.weaponBox.castShadow = true;
            this.weaponBox.receiveShadow = true;
            this.weaponBox.position.set(x + 8, y - 4,
                12)
            this.weaponBox.rotation.z = z

            this.weaponBox2 = new THREE.Mesh(weapon, weaponColor);
            this.weaponBox2.castShadow = true;
            this.weaponBox2.receiveShadow = true;
            this.weaponBox2.position.set(x + 8, y - 4,
                -12)
            this.weaponBox2.rotation.z = z

            this.mesh.add(this.weaponBox, this.weaponBox2);
            num++;
        }

        Bullet.prototype.auto = function (speed) {
            weaponBox.rotation.z = z + rot;
            weaponBox2.rotation.z = z + rot;
            _this.mesh.position.y += k * speed;
        }


        Bullet.prototype.move = function (speed, type) {
            let _this = this;
            let timer = null;

            function bullet_move() {
                timer = requestAnimationFrame(bullet_move);
                _this.mesh.position.x += speed;

                if (arrEnemy.length > 0) {
                    let px = _this.mesh.children[0].position.x + _this.mesh.position.x;
                    let py = _this.mesh.children[0].position.y + _this.mesh.position.y;

                    for (let i = 0; i < arrEnemy.length; i++) {
                        let elx = arrEnemy[i].mesh.position.x;
                        let ely = arrEnemy[i].mesh.position.y;

                        if (px < elx + 13 && px > elx - 13 && py < ely + 13 && py > ely - 13) {
                            arrEnemy[i].s && arrEnemy[i].s === 1 ? null : life_update(arrEnemy[i], 1, 1);
                            power_update(1)
                            scene.remove(_this.mesh);
                            arr = arr.filter(itme => itme.num != _this.num);
                            cancelAnimationFrame(timer);
                        }
                    }

                    if (_this.mesh.position.x >= 200) {
                        scene.remove(_this.mesh);
                        arr = arr.filter(itme => itme.num != _this.num);
                        cancelAnimationFrame(timer);
                    }

                } else {
                    _this.mesh.position.y = 0
                }
            }

            function bullet_move2() {
                let rot = 90 * Math.PI / 180
                timer = requestAnimationFrame(bullet_move2);
                _this.mesh.position.x += speed;
                _this.weaponBox.rotation.z = c + rot;
                _this.weaponBox2.rotation.z = c + rot;
                _this.mesh.position.y += k * speed;

                if (arrEnemy.length > 0) {
                    let px = _this.mesh.children[0].position.x + _this.mesh.position.x;
                    let py = _this.mesh.children[0].position.y + _this.mesh.position.y;
                    let elx = airplane.mesh.position.x;
                    let ely = airplane.mesh.position.y;

                    if (px < elx + 13 && px > elx - 13 && py < ely + 13 && py > ely - 13) {
                        if (airplane.lifeValue > 0 && airplane.cover != 1) {
                            life_update(airplane, 1, 0)
                        }

                        scene.remove(_this.mesh);
                        arr = arr.filter(itme => itme.num != _this.num);
                        cancelAnimationFrame(timer);
                    }

                    if (_this.mesh.position.x <= -200) {
                        scene.remove(_this.mesh);
                        arr = arr.filter(itme => itme.num != _this.num);
                        cancelAnimationFrame(timer);
                    }
                }
            }

            type === 0 ? bullet_move() : bullet_move2();
        }

        function remove_item(a, tag) {
            return a.filter(itme => itme.num != tag);
        }


        class Obstacle {
            constructor() {
                this.num = 3;
                let arc = new THREE.BoxGeometry(10, 10, 10);
                let arcColor = new THREE.MeshPhongMaterial({
                    color: Colors.red
                });

                this.box = new THREE.Mesh(arc, arcColor)
                this.box.castShadow = true;
                this.box.receiveShadow = true;
                this.box.rotation.x = Math.random() * 5;
                this.box.rotation.y = Math.random() * 5;
            }

            move() {
                let _this = this,
                    i = 0,
                    yran = -20 - Math.random() * 180,
                    stepAngle = null,
                    timer = null;

                function run() {
                    i += 1;
                    stepAngle = Math.PI / 180 * i;
                    timer = requestAnimationFrame(run);
                    _this.box.position.x = Math.sin(stepAngle) * 250;
                    _this.box.position.y = Math.cos(stepAngle) * yran;
                    _this.box.rotation.z = stepAngle + Math.PI / 2;

                    if (_this.box.position.x < -235) {
                        scene.remove(_this.box);
                        cancelAnimationFrame(timer);
                        return false
                    }

                    let originPoint = _this.box.position.clone();

                    for (let vertexIndex = 0; vertexIndex < _this.box.geometry.vertices.length; vertexIndex++) {
                        // 顶点原始坐标
                        let localVertex = _this.box.geometry.vertices[vertexIndex].clone();
                        // 顶点经过变换后的坐标
                        let globalVertex = localVertex.applyMatrix4(_this.box.matrix);
                        // 获得由中心指向顶点的向量
                        let directionVector = globalVertex.sub(_this.box.position);

                        // 将方向向量初始化,并发射光线
                        let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
                        // 检测射线与多个物体的相交情况
                        // 如果为true，它还检查所有后代。否则只检查该对象本身。缺省值为false
                        let collisionResults = ray.intersectObjects(crr, true);
                        // 如果返回结果不为空，且交点与射线起点的距离小于物体中心至顶点的距离，则发生了碰撞
                        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                            if (airplane.cover === 0) {
                                airplane.down();
                                life_update(airplane, _this.num, 0);
                            }

                            scene.remove(_this.box);
                            cancelAnimationFrame(timer);
                            return false
                        }
                    }
                }

                run()
            }
        }

        /**
         * 血块
         * @class Blood
         * @constructor
         */
        class Blood {
            constructor() {
                this.mesh = new THREE.Object3D();
                this.mesh.castShadow = true;
                this.mesh.receiveShadow = true;
                this.bo = Math.floor(Math.random() * 5) + 3;
                this.box = [];
                // let sanjiao = new THREE.SphereGeometry(2, 10, 10);
                let sanjiao = new THREE.TetrahedronGeometry(3)
                let sanjiaoColor = new THREE.MeshPhongMaterial({
                    color: Colors.blue
                });

                for (let index = 0; index < this.bo; index++) {
                    this.box[index] = new THREE.Mesh(sanjiao, sanjiaoColor)
                    this.box[index].position.x = index * 10;
                    this.box[index].position.y = Math.random() * 2;
                    this.box[index].rotation.z = index * 10;
                    this.box[index].castShadow = true;
                    this.box[index].receiveShadow = true;
                    this.mesh.add(this.box[index])
                }
            }

            move() {
                let _this = this,
                    timer = null,
                    z = 0,
                    yran = -20 - Math.random() * 180,
                    stepAngle = null,
                    boom = 0,
                    num = _this.box.length,
                    originPoint = null,
                    localVertex = null,
                    globalVertex = null,
                    directionVector = null,
                    ray = null,
                    collisionResults = null;

                function run() {
                    timer = requestAnimationFrame(run);
                    z += 1;
                    stepAngle = Math.PI / 180 * z;
                    _this.mesh.position.x = Math.sin(stepAngle) * 250;
                    _this.mesh.position.y = Math.cos(stepAngle) * yran;

                    if (_this.mesh.position.x < -230) {
                        scene.remove(_this.mesh);
                        cancelAnimationFrame(timer);
                        return false
                    }

                    for (let i = 0; i < num; i++) {
                        originPoint = _this.box[i].position.clone();
                        originPoint.y += _this.mesh.position.y;
                        originPoint.x += _this.mesh.position.x;
                        boom = 0;

                        for (let vertexIndex = 0; vertexIndex < _this.box[i].geometry.vertices.length; vertexIndex++) {
                            // 顶点原始坐标
                            localVertex = _this.box[i].geometry.vertices[vertexIndex].clone();
                            // 顶点经过变换后的坐标
                            globalVertex = localVertex.applyMatrix4(_this.box[i].matrix);
                            // 获得由中心指向顶点的向量
                            directionVector = globalVertex.sub(_this.box[i].position);
                            // 将方向向量初始化,并发射光线
                            ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
                            // 检测射线与多个物体的相交情况
                            // 如果为true，它还检查所有后代。否则只检查该对象本身。缺省值为false
                            collisionResults = ray.intersectObjects(crr, true);
                            // 如果返回结果不为空，且交点与射线起点的距离小于物体中心至顶点的距离，则发生了碰撞
                            if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                                _this.mesh.remove(_this.box[i]);
                                boom = 1;
                            }
                        }

                        if (boom === 1) {
                            _this.box.splice(i, 1);
                            life_update(airplane, -1, 0);
                            i--;
                            num--;
                        }
                    }
                }
                run();
            }
        }

        /**
         * 圆形贴图构造类
         * @class huan
         */

        class huan {
            constructor(url, size) {
                let material = new THREE.MeshLambertMaterial({
                    map: new THREE.TextureLoader().load(url),
                    transparent: true
                });
                let g = new THREE.CircleGeometry(size, 50, Math.PI / 3, Math.PI * 2);
                this.mesh = new THREE.Mesh(g, material);
            }
        }

        class Boss extends Enemy {
            constructor() {
                super()
                this.s = 0;
            }

            auto() {
                let _this = this,
                    timer = null;

                function run() {
                    timer = requestAnimationFrame(run)

                    if (airplane.lifeValue > 0) {
                        let x1 = _this.mesh.position.x,
                            y1 = _this.mesh.position.y,
                            x2 = airplane.mesh.position.x,
                            y2 = airplane.mesh.position.y;

                        //斜率
                        k = (y1 - y2) / (x1 - x2);

                        //弧度
                        c = Math.atan(k);

                        //弧度转角度
                        let z = c * 180 / Math.PI;

                        _this.weaponBox.rotation.z = -90 * Math.PI / 180 - c;
                        _this.weaponBox2.rotation.z = -90 * Math.PI / 180 - c;

                        if (_this.lifeValue <= 50 && _this.s === 0) {
                            _this.shields();
                            _this.s = 1;
                        }
                    } else {
                        _this.weaponBox.rotation.z = -90 * Math.PI / 180;
                        _this.weaponBox2.rotation.z = -90 * Math.PI / 180;
                    }
                }

                run()
            }

            shields() {
                let bol = 0,
                    timer = null,
                    _this = this,
                    s = new THREE.SphereGeometry(80, 18, 12),
                    color = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        wireframe: true,
                        opacity: .5,
                    }),
                    box = new THREE.Mesh(s, color);

                this.mesh.add(box);
                this.cover = 1;

                setTimeout(() => {
                    timer = setInterval(() => {
                        if (bol % 2 === 0) {
                            _this.mesh.add(box);

                        } else if (bol > 10) {
                            _this.s = 2
                            _this.cover = 0;
                            _this.mesh.remove(box);
                            clearInterval(timer);
                            q_time.start()
                            q_i.style.display = 'none'

                        } else {
                            _this.mesh.remove(box);
                        }

                        bol += 1;
                    }, 300);
                }, 5000)
            }
        }



        /**
         * 生命值更新方法
         * @method life_update 
         * 
         * @param {object} tag 生命值改变的单位
         * @param {number} value 要改变的生命值
         * @param {number} type 单位类型 0为玩家 1为敌人
         */
        function life_update(tag, value, type) {
            tag.lifeValue -= value;

            if (tag.lifeValue <= 0) {
                tag.lifeValue = 0;
            } else if (tag.lifeValue >= 100) {
                tag.lifeValue = 100;
            }

            if (type === 0) {
                dom.innerHTML = tag.lifeValue;
                dombar.style.width = 180 / 100 * tag.lifeValue + "px";
            }
        }

        /**
         * 能量更新
         * @method power_update 
         * @param {number} value 数值变化
         */

        function power_update(value) {
            airplane.power += value;
            airplane.power > 100 && (airplane.power = 100);
            airplane.power <= 0 && (airplane.power = 0);
            dom2.innerHTML = airplane.power;
            dombar2.style.width = 180 / 100 * airplane.power + "px";
            if (airplane.power < 20) {
                q_i.style.color = "gray";
            } else {
                q_i.style.color = "#f25346";
            }

            if (airplane.power < 90) {
                w_i.style.color = "gray";
            } else {
                w_i.style.color = "#f25346";
            }
        }