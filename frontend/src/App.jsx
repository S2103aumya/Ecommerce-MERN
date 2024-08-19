import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import BagIcon from './BagIcon';
import WishlistIcon from './wishicon';

const App = () => {
  const [itemCount, setItemCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);


  useEffect(() => {
        fetch('/api/carts/itemCount')
          .then(res => res.json())
          .then(data => setItemCount(data.itemCount));
    
        fetch('/api/wishlist/itemCount') // Fetch wishlist item count
        .then(res => res.json())
        .then(data => setWishlistCount(data.itemCount));
    }, []);

  return (
      <div>
          <nav>
              <span className="badge bg-danger">{itemCount}</span>
              <span className="badge bg-info">Wishlist: {wishlistCount}</span>

          </nav>
          <BagIcon setItemCount={setItemCount} />
          <WishlistIcon setWishlistCount={setWishlistCount} />

      </div>
  );
};

export default App;
