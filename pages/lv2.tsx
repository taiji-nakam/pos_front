import React, { useState } from "react";
import 'dotenv/config';
import { Html5QrcodeScanner } from "html5-qrcode"; // ✅ QRコード & バーコード読み取り用

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
  const handleIdRequest = async (eventOrCode: React.FormEvent | string) => {
    let codeToFetch = scannedCode; // デフォルトは手入力値を使用
  
    if (typeof eventOrCode === "string") {
      // 文字列（バーコードスキャン時）
      codeToFetch = eventOrCode;
    } else {
      // フォーム送信時
      eventOrCode.preventDefault();
    }
  
    try {
      console.log("Scancode:", codeToFetch);
      const res = await fetch(API_BASE_URL + `/prd/${codeToFetch}`, {
        method: "GET",
        mode: "cors",
      });
  
      if (!res.ok) {
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
      setPrdId(data.prd_id);
      setName(data.name);
      setPrice(data.price);
      setQuantity(1);
  
    } catch (error) {
      console.error("商品コード読み込み処理に失敗しました:", error);
      alert("商品コード読み込み処理に失敗しました。\n" + error);
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
      <div className="card bg-white shadow-xl p-6 w-full max-w-md">
        {/* スキャン（カメラ）ボタン */}
        <button
          onClick={() => {
            const scanner = new Html5QrcodeScanner(
              "reader",
              { fps: 10, qrbox: 250 },
              false
            );
            scanner.render(
              (decodedText) => {
                setScannedCode(decodedText); // スキャン結果をセット
                handleIdRequest(decodedText); // 取得したコードで商品情報を検索
                scanner.clear(); // スキャン後にカメラを閉じる
              },
              (error) => console.error("読み取りエラー:", error)
            );
          }}
          className="btn bg-blue-300 text-black w-full h-12 text-lg border-2 border-black rounded-none
                     hover:bg-blue-600 hover:text-white"
        >
          スキャン（カメラ）
        </button>
  
        {/* 商品情報入力 */}
        <input
          type="text"
          value={scannedCode}
          readOnly
          className="input input-bordered w-full text-center mt-4 bg-gray-200 text-lg"
        />
        <input
          type="text"
          value={name}
          readOnly
          className="input input-bordered w-full text-center mt-2 bg-gray-200 text-lg"
        />
        <input
          type="text"
          value={`¥${price}`}
          readOnly
          className="input input-bordered w-full text-center mt-2 bg-gray-200 text-lg"
        />
  
        {/* 追加ボタン */}
        <button
          onClick={addItemToCart}
          className="btn bg-blue-300 w-full h-12 text-lg text-black mt-4 border-2 border-black rounded-none
                     hover:bg-blue-600 hover:text-white"
        >
          追加
        </button>
  
        {/* 購入リスト */}
        <h2 className="text-lg font-semibold mt-6 text-center text-black">購入リスト</h2>
        <div className="mt-2 bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-300 h-48 overflow-y-auto">
          <ul className="space-y-1">
            {cart.map((item, index) => (
              <li key={`${item.prdId}-${index}`} className="flex justify-between text-sm text-black">
                <input name="prdId" type="hidden" value={item.prdId} />
                <input name="code" type="hidden" value={item.code} />
                <span>{item.name} x{item.quantity}</span>
                <span>¥{item.totalPrice}</span>
              </li>
            ))}
          </ul>
        </div>
  
        {/* 購入ボタン */}
        <button
          onClick={handleCheckout}
          className="btn bg-blue-300 text-black w-full h-12 text-lg border-2 border-black rounded-none mt-4
                     hover:bg-blue-600 hover:text-white"
        >
          購入
        </button>
      </div>
    </div>
  );
};

export default POSApp;
