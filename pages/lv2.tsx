import React, { useEffect, useState } from "react";
import 'dotenv/config';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTax, Tax } from "../contexts/TaxContext";

// Item 型定義
type Item = {
  prdId: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
};

const POSApp: React.FC = () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;
  const [prdId, setPrdId] = useState<string>("");
  const [scannedCode, setScannedCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<Item[]>([]);
  const { tax, setTax } = useTax();
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);

  // 画面表示時に Tax データを取得
  useEffect(() => {
    const fetchTax = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tax`);
        if (!res.ok) throw new Error("税データの取得に失敗しました");
        const data: Tax = await res.json();
        setTax(data);
      } catch (error) {
        console.error("税データの取得に失敗しました:", error);
      }
    };
    fetchTax();
  }, [setTax]);

  // スキャナを起動
  const startScanner = () => {
    if (scanner) return;

    const newScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    newScanner.render(
      (decodedText) => {
        setScannedCode(decodedText);
        handleIdRequest(decodedText);

        setTimeout(() => {
          newScanner.clear();
          setScanner(null);
        }, 2000);
      },
      (error) => console.error("読み取りエラー:", error)
    );

    setScanner(newScanner);
  };

  // 商品情報取得
  const handleIdRequest = async (code: string) => {
    try {
      const res = await fetch(API_BASE_URL + `/prd/${code}`);
      if (!res.ok) {
        if (res.status === 404) {
          setName("商品がマスタ未登録です");
        } else {
          alert("エラー: " + res.statusText);
        }
        return;
      }
      const data = await res.json();
      setPrdId(data.prd_id);
      setName(data.name);
      setPrice(data.price);
      setQuantity(1);
    } catch (error) {
      console.error("商品コード読み込みに失敗:", error);
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
      
      // 金額を数値に戻す
      const checkoutData = {
        cart: cart.map(item => ({
          ...item,
          totalPrice: Number(item.totalPrice.toString().replace(/,/g, "")) // カンマを削除
        })),
        emp_cd: "9999999999",
        store_cd: "30",
        pos_no: "90",
        tax_code: tax?.code,
        tax_percent: tax?.percent,
      };
      console.log("checkoutData:", checkoutData);
      
      const res = await fetch(API_BASE_URL + "/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });

      if (!res.ok) {
        throw new Error(`エラー: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("data:", data);
      alert(`合計金額 (税込): ¥${Math.floor(data.total_amount_ex_tax).toLocaleString()}\n　　(税抜): ¥${data.total_amount.toLocaleString()}`);

      setCart([]);
    } catch (error) {
      console.error("購入処理に失敗しました:", error);
      alert("購入処理に失敗しました。");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="card bg-white shadow-xl p-6 w-full max-w-md">
        {/* スキャン（カメラ）ボタン */}
        <button
          onClick={startScanner}
          className="btn bg-blue-300 text-black w-full h-12 text-lg border-2 border-black rounded-none hover:bg-blue-600 hover:text-white"
        >
          スキャン（カメラ）
        </button>

        {/* カメラリーダー */}
        <div id="reader" className="mt-4"></div>

        {/* 商品情報 */}
        <input
          type="text"
          value={scannedCode}
          onChange={(e) => setScannedCode(e.target.value)}
          onBlur={() => handleIdRequest(scannedCode)}
          className="input input-bordered w-full text-center mt-4 bg-gray-200 text-lg"
          placeholder="商品コードを入力"
        />
        <input
          type="text"
          value={name}
          readOnly
          className="input input-bordered w-full text-center mt-2 bg-gray-200 text-lg"
        />
        <input
          type="text"
          value={`¥${price.toLocaleString()}`} // 3桁区切りカンマ
          readOnly
          className="input input-bordered w-full text-center mt-2 bg-gray-200 text-lg"
        />

        {/* 追加ボタン */}
        <button
          onClick={() => setCart([...cart, { prdId, code: scannedCode, name, price, quantity, totalPrice: price * quantity }])}
          className="btn bg-blue-300 w-full h-12 text-lg text-black mt-4 border-2 border-black rounded-none hover:bg-blue-600 hover:text-white"
        >
          追加
        </button>

        {/* 購入リスト */}
        <h2 className="text-lg font-semibold mt-6 text-center text-black">購入リスト</h2>
        <div className="mt-2 bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-300 h-48 overflow-y-auto">
          <ul className="space-y-1">
            {cart.map((item, index) => (
              <li key={`${item.prdId}-${index}`} className="flex justify-between text-sm text-black">
                <span>{item.name} x{item.quantity}</span>
                <span>¥{item.totalPrice.toLocaleString()}</span> {/* 3桁区切りカンマ */}
              </li>
            ))}
          </ul>
        </div>

        {/* 購入ボタン */}
        <button
          onClick={handleCheckout}
          className="btn bg-blue-300 text-black w-full h-12 text-lg border-2 border-black rounded-none mt-4 hover:bg-blue-600 hover:text-white"
        >
          購入
        </button>
      </div>
    </div>
  );
};

export default POSApp;
