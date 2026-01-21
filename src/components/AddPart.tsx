import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './AddPart.css';

interface AddPartProps {
  onPartAdded: () => void;
}

export const AddPart: React.FC<AddPartProps> = ({ onPartAdded }) => {
  const [formData, setFormData] = useState({
    partname: '',
    vendor: '',
    price: '',
    sap_code: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const part = {
      id: uuidv4(),
      ...formData,
      price: parseFloat(formData.price),
    };

    try {
      await (window as any).electron.addPart(part);
      setFormData({ partname: '', vendor: '', price: '', sap_code: '' });
      onPartAdded();
    } catch (error) {
      console.error('부품 추가 오류:', error);
    }
  };

  return (
    <form className="add-part" onSubmit={handleSubmit}>
      <h2>새 부품 추가</h2>
      <input
        type="text"
        name="partname"
        placeholder="부품명"
        value={formData.partname}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="vendor"
        placeholder="공급업체"
        value={formData.vendor}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="price"
        placeholder="단가"
        value={formData.price}
        onChange={handleChange}
        step="0.01"
        required
      />
      <input
        type="text"
        name="sap_code"
        placeholder="SAP 코드 (선택)"
        value={formData.sap_code}
        onChange={handleChange}
      />
      <button type="submit">추가</button>
    </form>
  );
};
