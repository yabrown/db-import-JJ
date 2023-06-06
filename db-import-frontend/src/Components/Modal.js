import React, { useState } from 'react';
import {basicGet} from '../backend'
import '../backend'

const ConfirmationPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    // Handle the "Yes" action
    basicGet();

    handleClose();
  };

  const handleCancel = () => {
    // Handle the "No" action
    console.log('Cancelled');
    handleClose();
  };

  return (
    <div>
      <button onClick={handleOpen}>Open Popup</button>

      {isOpen && (
        <div className="popup">
          <div className="popup-content">
            <h3>Table up-to-date</h3>
            <p>Are you sure you want to proceed?</p>
            <div className="popup-actions">
              <button onClick={handleConfirm}>Yes</button>
              <button onClick={handleCancel}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ConfirmationPopup};