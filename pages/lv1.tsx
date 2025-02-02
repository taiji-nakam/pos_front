import React, { useState } from "react";
import 'dotenv/config';

type Item = {
  prdId: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
};

const POSApp: React.FC = () => {

  // FastAPI の URL を指定
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;
  console.log('API_BASE_URL:',API_BASE_URL);
  // console.log(process.env.NEXT_PUBLIC_API_ENDPOINT);

  // const [id, setId] = useState('');
  // const [idResponse, setIdResponse] = useState('');
  const [prdId, setPrdId] = useState<string>("12345");
  const [scannedCode, setScannedCode] = useState<string>("12345");
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  // const [totalPrice, setTotalPrice] = useState<number>(0);
  const [cart, setCart] = useState<Item[]>([]);
  // const [total, setTotal] = useState<number>(0);

  // IDを指定してGETリクエストを送信
  const handleIdRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Scancode:",scannedCode)
      const res = await fetch(API_BASE_URL + `/prd/${scannedCode}`, {
          method: 'GET',
          mode: 'cors', // CORS を明示的に有効化
      });
      // ステータスコードをチェック
      if (!res.ok) {
        // HTTP ステータスコードによる制御
        if (res.status === 404) {
          setName("商品がマスタ未登録です");
        } else {
          console.error("エラー: その他のエラー");
          alert("エラーが発生しました: " + res.statusText);
        }
        return;
      }
      const data = await res.json();
      console.log("リクエストの結果:", data);
      console.log("name:", data.name);
      setPrdId(data.prd_id);
      setName(data.name);
      setPrice(data.price);
      setQuantity(1);

    } catch (error) {
      // ネットワークエラーやその他のエラーをキャッチ
      console.error("商品コード読み込み処理に失敗しました:", error);
      alert("商品コード読み込み処理に失敗しました。");
    }
  };

  // 購入処理
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("カートが空です");
      return;
    }
    try {
      console.log("cart:", cart);
      const checkoutData = {
        cart,
        emp_cd: "9999999999",
        store_cd:"30",
        pos_no: "90"
      };
      const res = await fetch(API_BASE_URL + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData), 
      });

      if (!res.ok) {
        throw new Error(`エラー: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("data:",data);
      alert(`合計金額: ¥${data.total_amount}`);
      // カートをリセット
      setCart([]);
    } catch (error) {
      console.error("購入処理に失敗しました:", error);
      alert("購入処理に失敗しました。");
    }
  };

  // 購入リストに追加
  const addItemToCart = () => {
    if (!scannedCode) return;

    // const existingItemIndex = cart.findIndex((item) => item.prdId === scannedCode);
    // 新規商品を追加
    const newItem: Item = { prdId: prdId, code: scannedCode, name, price, quantity, totalPrice: price * quantity };
    setCart([...cart, newItem]);

    setScannedCode("");
    setName("");
    setPrice(0);
    setQuantity(1);
  };

  // 購入リストに追加（重複はインクリするバージョン）
  // const addItemToCart = () => {
  //   if (!scannedCode) return;

  //   const existingItemIndex = cart.findIndex((item) => item.id === scannedCode);
  //   if (existingItemIndex !== -1) {
  //     // 既存商品の数量を更新
  //     const updatedCart = [...cart];
  //     updatedCart[existingItemIndex].quantity += quantity;
  //     setCart(updatedCart);
  //   } else {
  //     // 新規商品を追加
  //     const newItem: Item = { id: scannedCode, name, price, quantity };
  //     setCart([...cart, newItem]);
  //   }

  //   setScannedCode("");
  //   setName("");
  //   setPrice(0);
  //   setQuantity(1);
  // };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="card bg-white shadow-xl p-6 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-4 text-black">POSアプリケーション</h1>
  
        {/* 商品コード入力フォーム */}
        <form onSubmit={handleIdRequest} className="flex flex-col items-center gap-3">
          <input
            type="text"
            className="input input-bordered w-full h-12 text-lg" // ✅ 文字色を明示的に黒
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            placeholder="コードを入力"
          />
          <button type="submit" className="btn btn-primary w-full h-12 text-lg text-black">商品コード読み込み</button>
        </form>
  
        {/* 商品情報 */}
        <div className="mt-4 text-center bg-gray-200 p-3 rounded-lg">
          <div className="font-semibold text-lg text-black">名称:</div> {/* ✅ 文字色を黒 */}
          <div className="text-xl text-black">{name}</div> {/* ✅ 文字色を黒 */}
          <div className="font-semibold text-lg mt-2 text-black">単価:</div> {/* ✅ 文字色を黒 */}
          <div className="text-xl text-black">¥{price}</div> {/* ✅ 文字色を黒 */}
        </div>
  
        {/* 追加ボタン */}
        <button onClick={addItemToCart} className="btn btn-secondary w-full h-12 text-lg text-black mt-4">追加</button>
  
        {/* 購入リスト */}
        <h2 className="text-2xl font-semibold mt-6 text-center text-black">購入リスト</h2>
        <ul className="mt-2 bg-gray-50 p-3 rounded-lg shadow-sm h-48 overflow-y-auto space-y-2">
          {cart.map((item, index) => (
            <li key={`${item.prdId}-${index}`} className="p-3 border-b text-center bg-gray-100 rounded-lg">
              <input name="prdId" type="hidden" value={item.prdId} />
              <input name="code" type="hidden" value={item.code} />
              <div className="text-lg text-black">{item.name} x {item.quantity}</div> {/* ✅ 文字色を黒 */}
              <div className="text-lg font-bold text-black">¥{item.totalPrice}</div> {/* ✅ 文字色を黒 */}
            </li>
          ))}
        </ul>
  
        {/* 購入ボタン */}
        <button onClick={handleCheckout} className="btn btn-accent w-full h-12 text-lg text-black mt-4">購入</button>
      </div>
    </div>
  );
};

export default POSApp;
