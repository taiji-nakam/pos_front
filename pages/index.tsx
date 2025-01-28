import React, { useState } from "react";
import 'dotenv/config';

type Item = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const POSApp: React.FC = () => {

  console.log(process.env); // 全ての環境変数を表示

  // FastAPI の URL を指定
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;
  // console.log('API_BASE_URL:');
  // console.log(process.env.NEXT_PUBLIC_API_ENDPOINT);

  //動的なGETリクエストの送信
  const [id, setId] = useState('');
  const [idResponse, setIdResponse] = useState('');

  const prd_id = "12345";
  // IDを指定してGETリクエストを送信
  const handleIdRequest = async (e) => {
    e.preventDefault();
    // const res = await fetch(API_BASE_URL + `/multiply/${id}`, {
    const res = await fetch(API_BASE_URL + `/prd/${prd_id}`, {
        method: 'GET',
    });
    const data = await res.json();

    console.log("リクエストの結果:", data);
    setIdResponse(data.doubled_value);
  };

  const [scannedCode, setScannedCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);


  // 商品情報を取得
  const handleScan = async () => {
    // try {
    //   const response = await fetch(`${API_BASE_URL}/items/${scannedCode}`);
    //   if (!response.ok) throw new Error("商品が見つかりません");
    //   const data: Item = await response.json();
    //   setName(data.name);
    //   setPrice(data.price);
    //   setQuantity(1);
    // } catch (error) {
    //     if (error instanceof Error) {
    //         alert(error.message);
    //       } else {
    //         alert("不明なエラーが発生しました");
    //       }
    // }
  };

  // 購入リストに追加
  const addItemToCart = () => {
    if (!scannedCode) return;

    const existingItemIndex = cart.findIndex((item) => item.id === scannedCode);
    if (existingItemIndex !== -1) {
      // 既存商品の数量を更新
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
      setCart(updatedCart);
    } else {
      // 新規商品を追加
      const newItem: Item = { id: scannedCode, name, price, quantity };
      setCart([...cart, newItem]);
    }

    setScannedCode("");
    setName("");
    setPrice(0);
    setQuantity(1);
  };

  // 購入処理
  const handleCheckout = async () => {
    // try {
    //   const response = await fetch(`${API_BASE_URL}/checkout`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ cart }),
    //   });
    //   const data = await response.json();
    //   setTotal(data.total);
    //   alert(`合計金額は ¥${data.total} です！`);
    // } catch (error) {
    //   alert("購入処理に失敗しました");
    // }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>IDを指定してGETリクエストを送信</h2>
      <form onSubmit={handleIdRequest}>
        <input
          type="number"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="IDを入力してください"
        />
        <button type="submit">送信</button>
      </form>
      {idResponse && <p>FastAPIからの応答: {idResponse}</p>}

      <h1>POSアプリケーション</h1>
      {/* スキャンエリア */}
      <button onClick={handleScan}>スキャン(カメラ)</button>
      <div>
        <label>スキャンコード: </label>
        <input
          type="text"
          value={scannedCode}
          onChange={(e) => setScannedCode(e.target.value)}
          placeholder="コードを入力"
        />
      </div>

      {/* 商品情報 */}
      <div>
        <label>名称: </label>
        <span>{name}</span>
      </div>
      <div>
        <label>単価: </label>
        <span>{price}</span>
      </div>
      <div>
        <label>数量: </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
        />
      </div>
      <button onClick={addItemToCart}>購入リストに追加</button>

      {/* 購入リスト */}
      <h2>購入リスト</h2>
      <ul>
        {cart.map((item) => (
          <li key={item.id}>
            {item.name} - ¥{item.price} x {item.quantity}
          </li>
        ))}
      </ul>

      {/* 合計金額 */}
      <h2>合計金額: ¥{total}</h2>
      <button onClick={handleCheckout}>購入</button>
    </div>
  );
};

export default POSApp;
