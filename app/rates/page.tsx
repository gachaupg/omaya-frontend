import Rates from '@/features/rates/components/rates'
import KYCVerificationModal from "../dashboard/kyc/kycmodal";
import React from 'react'

const page = () => {
  return (
    <div>
        <Rates />
        <KYCVerificationModal />
    </div>
  )
}

export default page