import React, { useEffect,useState } from "react";
import 'dotenv/config';
import { Html5QrcodeScanner } from "html5-qrcode"; // QRコード & バーコード読み取り用
import { useTax, Tax } from "../contexts/TaxContext";

type Item = {
  prdId: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  prm_id: string;
  plan_name: string;
  plan_percent: number;
  plan_discount: number;
  plan_price: number;
  plan_totalPrice: number;
};

const POSApp: React.FC = () => {

  // FastAPI の URL を指定
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_ENDPOINT;
  const [prdId, setPrdId] = useState<string>("");
  const [scannedCode, setScannedCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<Item[]>([]);
  const { tax, setTax } = useTax();
  const [activeCode, setActiveCode] = useState<string>("");  // 現在アクティブなコード
  
  // 合計金額計算 (カート変更時に自動更新)
  const taxRate = tax?.percent ? tax.percent * 0.01 : 0;
  const totalWithoutTax = cart.reduce((sum, item) => 
    sum + (item.plan_discount !== 0 ? item.plan_price : item.price) * item.quantity, 
    0
  );
  const totalWithTax = totalWithoutTax * (1 + taxRate);

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
  }, [API_BASE_URL, setTax]);

  // バーコードスキャン時の処理
  const handleIdRequest = async (eventOrCode: React.FormEvent | string) => {
    let codeToFetch = scannedCode; // デフォルトは手入力値を使用
    
    if (typeof eventOrCode === "string") {
      codeToFetch = eventOrCode;
    } else {
      eventOrCode.preventDefault();
    }
    if (codeToFetch == ""){
      return;
    }

    try {
      console.log("Scancode:", codeToFetch);
  
      if (codeToFetch !== activeCode) {
        const res = await fetch(API_BASE_URL + `/prd_ex/${codeToFetch}`, {
          method: "GET",
          mode: "cors",
        });
  
        if (!res.ok) {
          if (res.status === 404) {
            setName("商品がマスタ未登録です");
          } else {
            alert("エラーが発生しました: " + res.statusText);
          }
          return;
        }
  
        const data = await res.json();
        console.log("リクエストの結果:", data);
    
        // カート内に同じ商品があるかチェック
        setCart((prevCart) => {
          const existingItemIndex = prevCart.findIndex((item) => item.prdId === data.prd_id);
  
          if (existingItemIndex !== -1) {
            // すでにカートにある場合 → 数量 +1 & 合計金額更新
            const updatedCart = [...prevCart];
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: updatedCart[existingItemIndex].quantity + 1,
              totalPrice: (updatedCart[existingItemIndex].quantity + 1) * updatedCart[existingItemIndex].price,
              plan_totalPrice: (updatedCart[existingItemIndex].quantity + 1) * updatedCart[existingItemIndex].plan_price,
            };
            setPrdId(data.prd_id);
            setName(data.name);
            setPrice(data.price);
            setQuantity(updatedCart[existingItemIndex].quantity);
            setActiveCode(codeToFetch);
            alert(`購入リストの${data.name}を1点追加しました`);
            return updatedCart;
          } else {
            // 新規追加
            const newItem: Item = { 
              prdId: data.prd_id, 
              code: codeToFetch, 
              name: data.name, 
              price: data.price, 
              quantity: 1, 
              totalPrice: data.price, 
              prm_id: data.prmid,
              plan_name: data.plan_name, 
              plan_percent: data.plan_percent, 
              plan_discount: data.plan_discount ?? 0,
              plan_price: (data.price - (data.plan_discount ?? 0)), 
              plan_totalPrice: (data.price - (data.plan_discount ?? 0))
            };
            setPrdId(data.prd_id);
            setName(data.name);
            setPrice(data.price);
            setQuantity(1);
            setActiveCode(codeToFetch);
            alert(`購入リストへ${data.name}を追加しました`);
            return [...prevCart, newItem];
          }
        });
      } else {
        if(quantity >= 99){
          alert("1度に購入できる数量は99個までです");
          return;
        }
        // 同じ商品を再スキャンした場合も、カート内の quantity を +1 する
        setCart((prevCart) =>
          prevCart.map((item) =>
            item.prdId === prdId 
              ? { 
                  ...item, 
                  quantity: item.quantity + 1, 
                  totalPrice: (item.quantity + 1) * item.price,
                  plan_totalPrice: (item.quantity + 1) * item.plan_price // ✅ plan_totalPrice を更新
                } 
              : item
          )
        );
        setQuantity(quantity + 1);
        alert(`購入リストの${name}を1点追加しました`);
      }
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
      // 金額を数値に戻す
      const checkoutData = {
        cart: cart.map(item => ({
          ...item,
          price: item.plan_discount !== 0 ? item.plan_price : item.price,  // 値引きありなら plan_price
          totalPrice: Number(
            (item.plan_discount !== 0 ? item.plan_totalPrice : item.totalPrice)
              .toString()
              .replace(/,/g, "")
          ) // カンマを削除
        })),
        emp_cd: "9999999999",
        store_cd: "30",
        pos_no: "90",
        tax_code: tax?.code,
        tax_percent: tax?.percent,
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
      alert(`合計金額 (税込): ¥${Math.floor(data.total_amount).toLocaleString()}\n　　(税抜): ¥${data.total_amount_ex_tax.toLocaleString()}`);

      // カートをリセット
      setCart([]);
      // ✅ 商品情報をクリア
      setScannedCode("");  
      setName("");         
      setPrice(0);         
      setQuantity(0);      
      setPrdId("");        
      setActiveCode("");

    } catch (error) {
      console.error("購入処理に失敗しました:", error);
      alert("購入処理に失敗しました。");
    }
  };

  // // 購入リストに追加
  // const addItemToCart = () => {
  //   if (!scannedCode) return;

  //   // const existingItemIndex = cart.findIndex((item) => item.prdId === scannedCode);
  //   // 新規商品を追加
  //   const newItem: Item = { prdId: prdId, code: scannedCode, name, price, quantity, totalPrice: price * quantity };
  //   setCart([...cart, newItem]);

    // setScannedCode("");
    // setName("");
    // setPrice(0);
    // setQuantity(1);
  // };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="card bg-white shadow-xl p-6 w-full max-w-lg">
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
                setScannedCode(decodedText);
                handleIdRequest(decodedText);
                scanner.clear();
              },
              (error) => console.error("読み取りエラー:", error)
            );
          }}
          className="btn bg-blue-300 text-black w-full h-12 text-lg border-2 border-black rounded-none hover:bg-blue-600 hover:text-white"
        >
          スキャン（カメラ）
        </button>
  
        {/* カメラリーダー（表示用） */}
        <div id="reader" className="mt-4"></div>
  
        {/* 商品情報 */}
        <input
          type="text"
          value={scannedCode}
          onChange={(e) => setScannedCode(e.target.value)}
          onBlur={() => handleIdRequest(scannedCode)}
          className="input input-bordered w-full text-center mt-4 bg-white text-lg"
          placeholder="商品コードを入力"
        />
        <input
          type="text"
          value={name}
          readOnly
          className="input input-bordered w-full text-center mt-2 bg-gray-200 text-lg"
        />
  
        {/* 単価・数量エリア */}
        <div className="flex mt-2 gap-2">
          <input
            type="text"
            value={`¥${price.toLocaleString()}`}
            readOnly
            className="input input-bordered w-1/2 text-center bg-gray-200 text-lg"
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const newQuantity = Math.max(0, Math.min(99, Number(e.target.value))); // 0〜99に制限
              setQuantity(newQuantity);
            }}
            min="0"
            max="99"
            className="input input-bordered w-1/2 text-center bg-white text-lg"
            placeholder="数量"
          />
        </div>
  
        {/* リスト削除 & 数量変更 ボタン */}
        <div className="flex mt-4 gap-4">
          <button
            onClick={() => {
              setCart((prevCart) =>
                prevCart.filter((item) => item.prdId !== prdId) // prdId に一致するアイテムを削除
              );

              // ✅ 商品情報をクリア
              setScannedCode("");  
              setName("");         
              setPrice(0);         
              setQuantity(1);      
              setPrdId("");        
              setActiveCode("");  // ✅ activeCode もリセット
            }}
            className="btn bg-blue-300 text-black w-1/2 h-12 text-lg border-2 border-black rounded-none hover:bg-blue-600 hover:text-white flex-grow"
          >
            リスト削除
          </button>

          <button
            onClick={() => {
              if (!activeCode) return; // activeCode が空なら処理を実行しない

              setCart(cart.map(item =>
                item.prdId === prdId 
                  ? { 
                      ...item, 
                      quantity, 
                      totalPrice: quantity * item.price, 
                      plan_totalPrice: quantity * item.plan_price 
                    } 
                  : item
              ));
              alert(`数量を ${quantity} 個に変更しました`);
            }}
            className="btn bg-blue-300 text-black w-1/2 h-12 text-lg border-2 border-black rounded-none hover:bg-blue-600 hover:text-white flex-grow"
          >
            数量変更
          </button>
        </div>
  
        {/* 購入リスト */}
        <h2 className="text-2xl font-semibold mt-6 text-center text-black">購入リスト</h2>
        <ul className="mt-2 bg-gray-50 p-3 rounded-lg shadow-sm h-48 overflow-y-auto space-y-2">
          {cart.map((item, index) => (
            <li key={`${item.prdId}-${index}`} className="flex items-center justify-between">
              <div>
                <input name="prdId" type="hidden" value={item.prdId} />
                <input name="code" type="hidden" value={item.code} />

                {/* 通常価格の表示 */}
                <div className="text-xs text-black">
                  {item.name} x{item.quantity} {item.price.toLocaleString()}円 {item.totalPrice.toLocaleString()}円
                </div>

                {/* 値引き情報を追加表示 (prm_id が空でない場合のみ) */}
                {item.prm_id && item.plan_name && (
                  <div className="text-xs text-gray-600 pl-4">
                    {item.plan_name}（{(item.plan_discount ?? 0).toLocaleString()}円引き）
                    （{((item.plan_discount ?? 0) * -1).toLocaleString()}円）
                    {(item.plan_price ?? item.price).toLocaleString()}円　
                    {(item.plan_totalPrice ?? (item.plan_price * item.quantity)).toLocaleString()}円
                  </div>
                )}
              </div>

              {/* ↑ボタン */}
              <button
                onClick={() => {
                  setActiveCode(item.code);
                  setScannedCode(item.code);
                  setName(item.name);
                  setPrice(item.price);
                  setQuantity(item.quantity);
                  setPrdId(item.prdId);
                }}
                className="btn bg-gray-300 text-black w-8 h-4 text-sm border-2 border-black rounded hover:bg-gray-500 hover:text-white flex-shrink-0 p-0 leading-none"
              >
                ↑
              </button>
            </li>
          ))}
        </ul>

        {/* 追加: 合計金額欄 */}
        <div className="text-lg text-black text-center mt-4 p-2 bg-gray-100 border border-gray-300 rounded">
          合計: <strong>¥{Math.floor(totalWithTax).toLocaleString()}</strong> （税抜 <strong>¥{totalWithoutTax.toLocaleString()}</strong> 円）
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
