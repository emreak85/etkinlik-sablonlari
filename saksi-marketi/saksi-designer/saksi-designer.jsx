import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

export default function SaksiDesigner() {
  // --- MEVCUT SAKSI STATE'LERİ ---
  const [saksiTuru, setSaksiTuru] = useState('fiber');
  const [yukseklik, setYukseklik] = useState(30);
  const [ustCap, setUstCap] = useState(25);
  const [altCap, setAltCap] = useState(20);
  const [saksiOlusturuldu, setSaksiOlusturuldu] = useState(false);

  // --- NANO BANANA (YAPAY ZEKA) STATE'LERİ ---
  const [mekanFoto, setMekanFoto] = useState(null);
  const [mekanFotoB64, setMekanFotoB64] = useState(null);
  const [isaretKonumu, setIsaretKonumu] = useState({ x: 50, y: 50 });
  const [yapayZekaYukleniyor, setYapayZekaYukleniyor] = useState(false);
  const [gercekciSonuc, setGercekciSonuc] = useState(null);

  // --- REFERANSLAR ---
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const saksiRef = useRef(null);

  const saksiOzellikleri = {
    fiber: { renk: 0x8b7355, metaliklik: 0.4, pürüzlülük: 0.7, ingilizce: "fiber" },
    ahsap: { renk: 0xa0522d, metaliklik: 0.1, pürüzlülük: 0.8, ingilizce: "wooden" },
    metal: { renk: 0xc0c0c0, metaliklik: 0.9, pürüzlülük: 0.3, ingilizce: "metal" },
    corten: { renk: 0xa0460f, metaliklik: 0.6, pürüzlülük: 0.6, ingilizce: "corten steel rust" },
    diger: { renk: 0xdeb887, metaliklik: 0.3, pürüzlülük: 0.75, ingilizce: "decorative" }
  };

  const olusturSaksi = () => {
    setSaksiOlusturuldu(true);
    
    setTimeout(() => {
      if (!containerRef.current) return;

      if (sceneRef.current && saksiRef.current) {
        sceneRef.current.remove(saksiRef.current);
      }

      if (!sceneRef.current) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current.clientWidth / containerRef.current.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 15, 30);
        camera.lookAt(0, 10, 0);
        cameraRef.current = camera;

        // Şeffaf arkaplan desteği eklendi
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true, 
            preserveDrawingBuffer: true 
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const groundGeometry = new THREE.PlaneGeometry(60, 60);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e8e8 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const animate = () => {
          requestAnimationFrame(animate);
          if (saksiRef.current) {
            saksiRef.current.rotation.y += 0.005;
          }
          renderer.render(scene, camera);
        };
        animate();
      }

      const ozellikleri = saksiOzellikleri[saksiTuru];
      const coneGeometry = new THREE.ConeGeometry(altCap / 2, yukseklik, 32, 1, true);

      const positionAttribute = coneGeometry.getAttribute('position');
      for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i);
        const scale = 1 - (y / yukseklik + 0.5) * (1 - ustCap / altCap);
        positionAttribute.setXZ(i, positionAttribute.getX(i) * scale, positionAttribute.getZ(i) * scale);
      }
      positionAttribute.needsUpdate = true;
      coneGeometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        color: ozellikleri.renk,
        metalness: ozellikleri.metaliklik,
        roughness: ozellikleri.pürüzlülük,
        side: THREE.DoubleSide
      });

      const saksi = new THREE.Mesh(coneGeometry, material);
      saksi.castShadow = true;
      saksi.receiveShadow = true;
      saksi.position.y = yukseklik / 2;
      
      sceneRef.current.add(saksi);
      saksiRef.current = saksi;
    }, 100);
  };

  // --- NANO BANANA 2. YOL (DOĞRUDAN IMAGEN ÇAĞRISI) ---

  const fotoYukle = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setMekanFoto(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Base64 formatına çeviriyoruz
      setMekanFotoB64(ev.target.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
    setGercekciSonuc(null);
  };

  const isaretKoy = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsaretKonumu({ x, y });
  };

  const nanoBananaCalistir = async () => {
    if (!mekanFotoB64) {
        alert("Lütfen önce bir mekan fotoğrafı yükleyin.");
        return;
    }

    setYapayZekaYukleniyor(true);
    
    try {
      // ADIM 3: BURAYA GOOGLE AI STUDIO'DAN ALDIĞIN YENİ API ANAHTARINI YAPIŞTIR
      const API_KEY = 'AIzaSyBfsHg8GZCDf3RuzHXvirN5wQv2tMN6jPk'; 
      
      // Yapay zeka İngilizce komutları daha iyi anladığı için seçilen saksının İngilizce karşılığını alıyoruz
      const saksıIngilizceAdi = saksiOzellikleri[saksiTuru].ingilizce;
      
      const yatay = isaretKonumu.x < 33 ? 'left' : isaretKonumu.x > 66 ? 'right' : 'center';
      const dikey = isaretKonumu.y < 35 ? 'back' : isaretKonumu.y > 70 ? 'foreground' : 'middle';
      
      // İŞTE SİHİRLİ KOMUT: Sadece Imagen modeline ne çizeceğini net bir şekilde söylüyoruz.
      // (Gemini generateContent adımını tamamen atladık!)
      const prompt = `Add a photorealistic ${saksıIngilizceAdi} planter pot to the image. Place it in the ${yatay} side, ${dikey} ground of the scene. Make it look like it naturally belongs there with correct lighting and shadows matching the room. Keep everything else exactly the same.`;

      // Sadece Imagen 3 inpainting modelini çağırıyoruz
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{
            prompt: prompt,
            image: { bytesBase64Encoded: mekanFotoB64, mimeType: 'image/jpeg' }
          }],
          parameters: { sampleCount: 1, editMode: 'inpainting-insert' }
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
          throw new Error(data.error?.message || "API Hatası");
      }

      if (data.predictions && data.predictions[0]) {
          const uretilenFoto = data.predictions[0].bytesBase64Encoded;
          setGercekciSonuc(`data:image/jpeg;base64,${uretilenFoto}`);
      } else {
          throw new Error("Görsel üretilemedi.");
      }

    } catch (error) {
      console.error("Yapay Zeka Hatası:", error);
      alert(`Bir hata oluştu: ${error.message}`);
    } finally {
      setYapayZekaYukleniyor(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '1.5rem', fontWeight: '500' }}>Kendi Saksını Tasarla</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* --- SOL PANEL: SAKSI ÖZELLİKLERİ --- */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '0.5rem', fontWeight: 'bold' }}>Saksı Türü</label>
            <select value={saksiTuru} onChange={(e) => setSaksiTuru(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}>
              <option value="fiber">Fiber Saksı</option>
              <option value="ahsap">Ahşap Saksı</option>
              <option value="metal">Metal Saksı</option>
              <option value="corten">Corten Saksı</option>
            </select>
          </div>
          <button onClick={olusturSaksi} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2d6035', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            ✓ Saksıyı Oluştur
          </button>
        </div>

        {/* --- SAĞ PANEL: 3D ALAN & YAPAY ZEKA --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div ref={containerRef} style={{ background: '#e8e8e8', borderRadius: '12px', height: '400px', overflow: 'hidden' }} />

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', opacity: saksiOlusturuldu ? 1 : 0.5, pointerEvents: saksiOlusturuldu ? 'auto' : 'none' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '1rem' }}>✨ Mekana Yerleştir (Yapay Zeka)</h3>

                {!mekanFoto ? (
                    <label style={{ display: 'block', padding: '2rem', textAlign: 'center', border: '2px dashed #d1d5db', borderRadius: '8px', cursor: 'pointer', background: '#f9fafb' }}>
                        📸 Mekan fotoğrafı yükle (JPG, PNG)
                        <input type="file" accept="image/*" onChange={fotoYukle} style={{ display: 'none' }} />
                    </label>
                ) : (
                    <div>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>Saksıyı koymak istediğiniz yere tıklayın.</p>
                        <div onClick={isaretKoy} style={{ position: 'relative', cursor: 'crosshair', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img src={mekanFoto} alt="Mekan" style={{ width: '100%', display: 'block' }} />
                            <div style={{ position: 'absolute', left: `${isaretKonumu.x}%`, top: `${isaretKonumu.y}%`, width: '20px', height: '20px', background: 'red', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '2px solid white', pointerEvents: 'none' }} />
                        </div>

                        <button onClick={nanoBananaCalistir} disabled={yapayZekaYukleniyor} style={{ width: '100%', marginTop: '1rem', padding: '12px', background: '#fef08a', color: '#854d0e', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: yapayZekaYukleniyor ? 'wait' : 'pointer' }}>
                            {yapayZekaYukleniyor ? '⌛ İşleniyor...' : 'Gerçekçi Görsel Oluştur'}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* --- SONUÇ EKRANI --- */}
      {gercekciSonuc && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', maxWidth: '800px', width: '100%' }}>
                  <img src={gercekciSonuc} style={{ width: '100%', borderRadius: '8px' }} alt="Sonuç" />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                      <a href={gercekciSonuc} download="mekan.jpg" style={{ padding: '10px 20px', background: '#2d6035', color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>İndir</a>
                      <button onClick={() => setGercekciSonuc(null)} style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}