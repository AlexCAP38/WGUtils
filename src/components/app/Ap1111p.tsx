import React, { useState, useCallback, useEffect } from 'react';
import nacl from 'tweetnacl';
import assert from 'assert';
import { encode } from '@stablelib/base64';

const clampSecret = (secret: Uint8Array) => {
  secret[0] &= 248;
  secret[31] = (secret[31] & 127) | 64;
  return secret;
}

const generateKeyPair = () => {
  const key = clampSecret(nacl.randomBytes(32));
  const keyPair = nacl.box.keyPair.fromSecretKey(key)
  const pub = keyPair.publicKey;
  assert.deepStrictEqual(keyPair.secretKey, key, "Invalid secret key");

  return {
    key, pub,
    keyString: encode(key),
    pubString: encode(pub),
  };
}

const generateData = () => {
  const psk = nacl.randomBytes(32);

  return {
    psk, pskString: encode(psk),
    alice: generateKeyPair(),
    bob: generateKeyPair()
  };
}

const App: React.FC = () => {
  const [history, setHistory] = useState("");
  const [data, setData] = useState<ReturnType<typeof generateData>>();
  const select = useCallback((t: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
    const target = t.target as HTMLInputElement;
    target.select();
  }, []);

  const regenerate = useCallback(() => {
    const data = generateData()
    setData(data);
    setHistory((history) => {
      return history + [
        data.alice.keyString,
        data.alice.pubString,
        data.bob.keyString,
        data.bob.pubString,
        data.pskString,
      ].join(",") + "\n";
    })
  }, [])

  const clear = useCallback(() => {
    setHistory("");
    regenerate();
  }, [regenerate])

  useEffect(() => {
    regenerate();
  }, [regenerate])

  const aliceDev = `[NetDev]
Name=wg0
Kind=wireguard

[WireGuard]
PrivateKey = ${data && data.alice.keyString}
# PublicKey = ${data && data.alice.pubString}
ListenPort = 51820

[WireGuardPeer]
PublicKey = ${data && data.bob.pubString}
AllowedIPs = 0.0.0.0/0
PresharedKey = ${data && data.pskString}
PersistentKeepalive = 25`
  
  const bobDev = `[NetDev]
Name=wg0
Kind=wireguard

[WireGuard]
PrivateKey = ${data && data.bob.keyString}
# PublicKey = ${data && data.bob.pubString}
ListenPort = 51820

[WireGuardPeer]
PublicKey = ${data && data.alice.pubString}
AllowedIPs = 0.0.0.0/0
PresharedKey = ${data && data.pskString}
PersistentKeepalive = 25`

  return (
    <div className="App">
      <fieldset>
        <legend>WGKeygen: Wireguard Key Generator</legend>
        <button onClick={regenerate}>Regenerate</button>
        <dl>
          <dt>psk</dt>
          <dd><input readOnly onClick={select} value={data && data.pskString}></input></dd>
          <dt>key (alice)</dt>
          <dd><input readOnly onClick={select} value={data && data.alice.keyString}></input></dd>
          <dt>pub (alice)</dt>
          <dd><input readOnly onClick={select} value={data && data.alice.pubString}></input></dd>
          <dt>key (bob)</dt>
          <dd><input readOnly onClick={select} value={data && data.bob.keyString}></input></dd>
          <dt>pub (bob)</dt>
          <dd><input readOnly onClick={select} value={data && data.bob.pubString}></input></dd>
        </dl>
      </fieldset>

      <fieldset>
        <legend>alice's wg.netdev</legend>
        <textarea readOnly rows={15} value={aliceDev}></textarea>
      </fieldset>

      <fieldset>
        <legend>bob's wg.netdev</legend>
        <textarea readOnly rows={15} value={bobDev}></textarea>
      </fieldset>

      <fieldset>
        <legend>history: [a.key, a.pub, b.key, b.pub, psk].join(",")</legend>
        <button onClick={clear}>Clear</button>
        <textarea readOnly rows={16} value={history}></textarea>
      </fieldset>

      <fieldset>
        <legend>links</legend>
        <ul>
          <li><a href="https://www.wireguard.com/" rel="nofollow noopener noreferrer">{"WireGuard project homepage"}</a></li>
          <li><a href="https://wiki.archlinux.org/index.php/WireGuard" rel="nofollow noopener noreferrer">{"WireGuard - ArchWiki"}</a></li>
        </ul>
      </fieldset>
    </div>
  );
}

export default App;
