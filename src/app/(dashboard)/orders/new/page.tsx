'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataCard } from '@/components/ui/DataCard';
import { Button } from '@/components/ui/Button';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuthStore } from '@/stores/auth';
import { searchCustomers } from '@/lib/api/customers';
import type { Customer } from '@/types';

interface OrderFormData {
  customerName: string;
  customerId: string;
  dueDate: string;
  note: string;
  items: {
    model: string;
    modelName: string;
    qty: number;
    unitPrice: number;
  }[];
}

export default function NewOrderPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createOrder = useCreateOrder();
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<OrderFormData>({
    defaultValues: {
      customerName: '',
      customerId: '',
      dueDate: '',
      note: '',
      items: [{ model: '', modelName: '', qty: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const totalAmount = items.reduce((sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0), 0);

  const handleCustomerSearch = async (query: string) => {
    setValue('customerName', query);
    if (query.length >= 1) {
      const results = await searchCustomers(query);
      setCustomerSuggestions(results);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setValue('customerName', customer.name);
    setValue('customerId', customer.id);
    setShowSuggestions(false);
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      const order = await createOrder.mutateAsync({
        customerId: data.customerId,
        customerName: data.customerName,
        items: data.items.map((item) => ({
          model: item.model,
          modelName: item.modelName || item.model,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          amount: Number(item.qty) * Number(item.unitPrice),
        })),
        totalAmount,
        dueDate: data.dueDate,
        note: data.note,
        createdBy: user?.name || '',
      });
      router.push(`/orders/${order.id}`);
    } catch {
      alert('주문 등록에 실패했습니다');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="주문 등록"
        action={
          <Button variant="secondary" size="sm" onClick={() => router.push('/orders')}>
            취소
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer */}
        <DataCard>
          <h3 className="text-base font-semibold text-gray-900 mb-3">고객 정보</h3>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">고객사</label>
            <input
              type="text"
              {...register('customerName', { required: '고객사를 입력해주세요' })}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="고객사명 입력"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
            />
            {errors.customerName && (
              <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
            )}
            {showSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {customerSuggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.industry && (
                      <span className="text-gray-400 ml-2">{c.industry}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">납기일</label>
            <input
              type="date"
              {...register('dueDate', { required: '납기일을 입력해주세요' })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>
            )}
          </div>
        </DataCard>

        {/* Items */}
        <DataCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">주문 품목</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ model: '', modelName: '', qty: 1, unitPrice: 0 })}
            >
              + 품목 추가
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">품목 {index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-sm text-red-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input
                      {...register(`items.${index}.model`, { required: true })}
                      placeholder="모델명 (예: TSP-338100)"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      {...register(`items.${index}.qty`, { required: true, min: 1, valueAsNumber: true })}
                      placeholder="수량"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      {...register(`items.${index}.unitPrice`, { required: true, min: 0, valueAsNumber: true })}
                      placeholder="단가 (원)"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
                <div className="text-right mt-2 text-sm font-medium text-gray-600">
                  소계: ₩{((items[index]?.qty || 0) * (items[index]?.unitPrice || 0)).toLocaleString('ko-KR')}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 text-right">
            <span className="text-sm text-gray-500 mr-3">총 금액</span>
            <span className="text-2xl font-bold text-gray-900">₩{totalAmount.toLocaleString('ko-KR')}</span>
          </div>
        </DataCard>

        {/* Note */}
        <DataCard>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">비고</label>
          <textarea
            {...register('note')}
            placeholder="특이사항을 입력하세요"
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none"
          />
        </DataCard>

        {/* Submit */}
        <Button
          type="submit"
          disabled={createOrder.isPending}
          className="w-full"
          size="lg"
        >
          {createOrder.isPending ? '등록 중...' : '주문 등록'}
        </Button>
      </form>
    </div>
  );
}
