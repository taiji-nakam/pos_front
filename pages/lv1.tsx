import React, { useState, useEffect } from "react";
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

  const [isAllowed, setIsAllowed] = useState<boolean>(true); // アクセス許可状態
  const [isLoading, setIsLoading] = useState<boolean>(true); // ローディング状態
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // クライアントIPアドレス
  // const [clientIp, setClientIp] = useState<string | null>(null); // クライアントIP
  
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Next.js の API `/api/get-ip` からクライアントのIPを取得
        const ipRes = await fetch("/api/get-ip");
        if (!ipRes.ok) throw new Error(`IP取得エラー: ${ipRes.status}`);
        const ipData = await ipRes.json();
        const clientIp = ipData.ip;
        console.log("取得したクライアントIP:", clientIp);
  
        // 取得したIPを FastAPI (`API_BASE_URL + /client-ip/`) に送信し、許可を確認
        console.log(API_BASE_URL + `/client-ip/`);
        const res = await fetch(API_BASE_URL + `/client-ip/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip: clientIp }), // IPを送信
          mode: 'cors', // CORS を明示的に有効化
        });
  
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "IP制限によりアクセスできません");
        }
  
        console.log("アクセス許可済み IP:", clientIp);
      } catch (error: unknown) {
        let errorMessage = "不明なエラーが発生しました";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error("アクセス制限:", errorMessage);
        setErrorMsg(errorMessage);
        setIsAllowed(false); // アクセス禁止状態にする
      } finally {
        setIsLoading(false); // ローディング終了
      }
    };
  
    checkAccess();
  }, []);
  


  if (isLoading) {
    return <div className="text-center p-6 text-xl">読み込み中...</div>;
  }
  // アクセス不可Page
  if (!isAllowed) {
    return (
      <div className="text-center p-6 text-xl text-red-600">
        お使いのデバイスではアクセスできません<br />（{errorMsg}）
      </div>
    );
  }

  // 商品データの取得
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="card bg-white shadow-xl p-6 w-full max-w-2xl">
        {/* 商品コード入力 & 購入リストを横並びに */}
        <div className="grid grid-cols-2 gap-4">
          {/* 左側（商品コード入力 & 商品情報） */}
          <div className="flex flex-col items-center w-full">
            {/* 商品コード入力 */}
            <input
              type="text"
              className="input input-bordered w-full max-w-xs h-12 text-lg text-black"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              placeholder="コードを入力"
            />
            <button
              type="submit"
              className="btn w-full max-w-xs h-12 text-lg text-black bg-blue-300 border border-black rounded-none mt-2 
                         hover:bg-blue-600 hover:text-white"
              onClick={handleIdRequest}
            >
              商品コード読み込み
            </button>
  
            {/* 商品情報 */}
            <input
              type="text"
              className="input input-bordered w-full max-w-xs h-12 text-lg text-black mt-4"
              value={name}
              readOnly
            />
            <input
              type="text"
              className="input input-bordered w-full max-w-xs h-12 text-lg text-black mt-2"
              value={`¥${price}`}
              readOnly
            />
  
            {/* 追加ボタン */}
            <button
              onClick={addItemToCart}
              className="btn w-full max-w-xs h-12 text-lg text-black bg-blue-300 border border-black rounded-none mt-4 
                         hover:bg-blue-600 hover:text-white"
            >
              追加
            </button>
          </div>
  
          {/* 右側（購入リスト） */}
          <div className="flex flex-col items-center w-full">
            <h2 className="text-lg font-semibold text-black">購入リスト</h2>
            <div className="mt-2 bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-300 w-full max-w-xs h-48 overflow-y-auto">
              <ul className="space-y-1">
                {cart.map((item, index) => (
                  <li
                    key={`${item.prdId}-${index}`}
                    className="flex justify-between text-sm text-black border-b p-1"
                  >
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
              className="btn w-full max-w-xs h-12 text-lg text-black bg-blue-300 border border-black rounded-none mt-4 
                         hover:bg-blue-600 hover:text-white"
            >
              購入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSApp;
