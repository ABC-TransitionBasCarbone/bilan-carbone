'use client';

import { EmissionFactorWithParts } from "@/db/emissionFactors";
import { FullStudy } from "@/db/study";
import DynamicComponent from "@/environments/core/utils/DynamicComponent";
import { CUT } from "@/store/AppEnvironment";
import { ExportRule } from "@prisma/client";
import AllResults, { default as AllResultsCUT } from '@/environments/cut/study/results/AllResults'


interface Props {
    study: FullStudy
    rules: ExportRule[]
    emissionFactorsWithParts: EmissionFactorWithParts[]
    validatedOnly: boolean
}

export default function DynamicAllResults({ study, rules, emissionFactorsWithParts, validatedOnly }: Props) {
    return (
        <DynamicComponent
            environmentComponents={{
                [CUT]: <AllResultsCUT
                    study={study}
                    rules={rules}
                    emissionFactorsWithParts={emissionFactorsWithParts}
                    validatedOnly={validatedOnly}
                />
            }}
            defaultComponent={<AllResults
                study={study}
                rules={rules}
                emissionFactorsWithParts={emissionFactorsWithParts}
                validatedOnly={validatedOnly}
            />}
        />
    );
}