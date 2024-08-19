import React from 'react';

const WishlistIcon = ({ setWishlistCount }) => {
    const addToWishlist = () => {
        fetch('/api/wishlist/add/1', { method: 'POST' }) // Adjust the URL as needed
        .then(res => res.json())
        .then(data => setWishlistCount(data.itemCount));
    };

    return (
        <button onClick={addToWishlist}>
        Add to Wishlist
        </button>
    );
};

export default WishlistIcon;
