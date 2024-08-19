// BagIcon.jsx
import React from 'react';

const BagIcon = ({ setItemCount }) => {
    const addToBag = () => {
        fetch('/api/carts/addtobag/1', { method: 'POST' })
            .then(res => res.json())
            .then(data => setItemCount(data.itemCount));
    };

    return (
        <button onClick={addToBag}>
            Add to Bag
        </button>
    );
};

export default BagIcon;
