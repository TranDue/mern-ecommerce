import Head from 'next/head'
import { useContext, useState, useEffect } from 'react'
import { DataContext } from '../store/GlobalState'
import CartItem from '../components/CartItem'
import Link from 'next/link'
import { getData, postData } from '../utils/fetchData'
import { useRouter } from 'next/router'


const Cart = () => {
  const { state, dispatch } = useContext(DataContext)
  const { cart, auth, orders } = state

  const [total, setTotal] = useState(0)

  const [address, setAddress] = useState('')
  const [mobile, setMobile] = useState('')

  const [callback, setCallback] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getTotal = () => {
      const res = cart.reduce((prev, item) => {
        return prev + (item.price * item.quantity)
      }, 0)

      setTotal(res)
    }

    getTotal()
  }, [cart])

  useEffect(() => {
    const cartLocal = JSON.parse(localStorage.getItem('__next__cart01__devtran'))
    if (cartLocal && cartLocal.length > 0) {
      let newArr = []
      const updateCart = async () => {
        for (const item of cartLocal) {
          const res = await getData(`product/${item._id}`)
          const { _id, title, images, price, inStock, sold } = res.product
          if (inStock > 0) {
            newArr.push({
              _id, title, images, price, inStock, sold,
              quantity: item.quantity > inStock ? 1 : item.quantity
            })
          }
        }

        dispatch({ type: 'ADD_CART', payload: newArr })
      }

      updateCart()
    }
  }, [callback])

  const handlePayment = async () => {
    if (!address || !mobile)
      return dispatch({ type: 'NOTIFY', payload: { error: 'Please add your address and mobile.' } })

    let newCart = [];
    for (const item of cart) {
      const res = await getData(`product/${item._id}`)
      if (res.product.inStock - item.quantity >= 0) {
        newCart.push(item)
      }
    }

    if (newCart.length < cart.length) {
      setCallback(!callback)
      return dispatch({
        type: 'NOTIFY', payload: {
          error: 'The product is out of stock or the quantity is insufficient.'
        }
      })
    }

    dispatch({ type: 'NOTIFY', payload: { loading: true } })

    postData('order', { address, mobile, cart, total }, auth.token)
      .then(res => {
        if (res.err) return dispatch({ type: 'NOTIFY', payload: { error: res.err } })

        dispatch({ type: 'ADD_CART', payload: [] })

        const newOrder = {
          ...res.newOrder,
          user: auth.user
        }
        dispatch({ type: 'ADD_ORDERS', payload: [...orders, newOrder] })
        dispatch({ type: 'NOTIFY', payload: { success: res.msg } })
        return router.push(`/order/${res.newOrder._id}`)
      })
  }

  if (cart.length === 0)
    return <img className="img-responsive w-100" src="/empty_cart.jpg" alt="not empty" />
  const paymentMomo = () => {
    // endpoint payment momo
    const endpoint = "https://test-payment.momo.vn/gw_payment/transactionProcessor"
    const hostname = "https://test-payment.momo.vn"

    // api endpoint
    const path = "gw_payment/transactionProcessor"

    // create  request example
    const partnerCode = "MOMOQIKG20201017"
    const accessKey = "s288OBQJn5Eogcw2"
    const serectkey = "AZT7Pr5WVmYGKfWEBOkzEfEqRNhvwT7u"
    const orderInfo = "Thánh toán tiền sách trên Website bằng ví MoMo"
    const returnUrl = "http://localhost:3000"
    const notifyurl = "https://momo.vn/return"
    const amount = "30000đ"
    const orderId = (Math.random().toString(36) + 'Momo').slice(2, 234234)
    const requestId = (Math.random().toString(36) + 'Momo').slice(2, 234234)
    const requestType = "captureMoMoWallet"
    const extraData = "merchantName=Tran Due"

    // create signature send to momo
    let newSinature =
      "partnerCode=" + partnerCode +
      "&accessKey=" + accessKey +
      "&requestId=" + requestId +
      "&amount=" + amount +
      "&orderId=" + orderId +
      "&orderInfo=" + orderInfo +
      "&returnUrl=" + returnUrl +
      "&notifyUrl=" + notifyurl +
      "&extraData=" + extraData

    // console.log("Raw signature >>>>>>>>>", newSinature)

    // use hash function for signature
    let signature = CryptoJS.HmacSHA256(newSinature, serectkey).toString(CryptoJS.enc.Hex)

    // change amount before send data
    const getAmount = amount.toString()

    // create body
    let body = JSON.stringify({
      partnerCode: partnerCode,
      accessKey: accessKey,
      requestId: requestId,
      amount: getAmount,
      orderId: orderId,
      orderInfo: orderInfo,
      returnUrl: returnUrl,
      notifyUrl: notifyurl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    // console.log("Body >>>>>>>", body)

    console.log('THis is signature =>>>>>', signature)

    const options = {
      hostname: 'test-payment.momo.vn',
      port: 443,
      path: '/gw_payment/transactionProcessor',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    // test url
    let url = options.hostname + ":" + options.port + options.path
    url = 'https://' + url
    console.log("URL >>>>>>>>>>", url)

    // post request to MoMo payment
    http.post(endpoint, body).then((res) => {
      window.open(res.data.payUrl)
    }, () => {
      console.log("thanh toán thất bại")
    })

  }
  return (
    <div className="row mx-auto">
      <Head>
        <title>Cart Page</title>
      </Head>

      <div className="col-md-8 text-secondary table-responsive my-3">
        <h2 className="text-uppercase">Shopping Cart</h2>

        <table className="table my-3">
          <tbody>
            {
              cart.map(item => (
                <CartItem key={item._id} item={item} dispatch={dispatch} cart={cart} />
              ))
            }
          </tbody>
        </table>
      </div>

      <div className="col-md-4 my-3 text-right text-uppercase text-secondary">
        <form>
          <h2>Shipping</h2>

          <label htmlFor="address">Address</label>
          <input type="text" name="address" id="address"
            className="form-control mb-2" value={address}
            onChange={e => setAddress(e.target.value)} />

          <label htmlFor="mobile">Mobile</label>
          <input type="text" name="mobile" id="mobile"
            className="form-control mb-2" value={mobile}
            onChange={e => setMobile(e.target.value)} />
        </form>

        <h3>Total: <span className="text-danger">${total}</span></h3>

        <Link href={auth.user ? '#!' : '/signin'}>
          <a className="btn btn-dark my-2" onClick={handlePayment}>Proceed with payment</a>
        </Link>
        <br />  <br />
        <button onClick={paymentMomo} className="btn btn-outline-danger w-100">
          <img src="https://frontend.tikicdn.com/_desktop-next/static/img/icons/checkout/icon-payment-method-mo-mo.svg" alt="momo loading" />
          Momo
        </button>
      </div>
    </div>
  )
}

export default Cart