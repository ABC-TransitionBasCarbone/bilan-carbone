'use client';

import SelectStudySite from "@/components/study/site/SelectStudySite";
import useStudySite from "@/components/study/site/useStudySite";
import { EmissionFactorWithParts } from "@/db/emissionFactors";
import { FullStudy } from "@/db/study";
import { Box, Button, Container, Tab, Tabs } from "@mui/material";
import { ExportRule, SubPost } from "@prisma/client";
import { useTranslations } from "next-intl";
import DownloadIcon from '@mui/icons-material/Download';
import { SyntheticEvent, useMemo, useState } from "react";
import Result from "@/components/study/results/Result";
import { computeResultsByPost } from "@/services/results/consolidated";
import { filterWithDependencies } from "@/services/results/utils";
import PieResult from "./PieResult";

interface Props {
    study: FullStudy,
    rules: ExportRule[],
    emissionFactorsWithParts: EmissionFactorWithParts[],
    validatedOnly: boolean,
}

interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && (
                <>{children}</>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

export default function AllResults({ study, rules, emissionFactorsWithParts, validatedOnly }: Props) {
    const [value, setValue] = useState(0);

    const handleChange = (event: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };
    const tPost = useTranslations('emissionFactors.post');

    const { studySite, setSite } = useStudySite(study, true)

    const allComputedResults = useMemo(
        () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
        [studySite, validatedOnly],
    )

    const computedResults = useMemo(
        () =>
            allComputedResults
                .map((post) => ({
                    ...post,
                    subPosts: post.subPosts.filter((subPost) => filterWithDependencies(subPost.post as SubPost, false)),
                }))
                .map((post) => ({ ...post, value: post.subPosts.reduce((res, subPost) => res + subPost.value, 0) })),
        [allComputedResults],
    )

    return (
        <Container>
            <Box component="section" sx={{ display: 'flex', gap: '1rem' }}>
                <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
                <Button variant="outlined" size="large" endIcon={<DownloadIcon />}>exporter mon Bilan Carbone</Button>
            </Box>
            <Tabs
                value={value}
                onChange={handleChange}
                indicatorColor="secondary"
                textColor="inherit"
                variant="fullWidth"
            >
                <Tab label="Tableau" />
                <Tab label="Diagramme en barres" />
                <Tab label="Diagramme circulaire" />
            </Tabs>
            <Box component="section">
                <TabPanel value={value} index={0}></TabPanel>
                <TabPanel value={value} index={1}>
                    <PieResult studySite={studySite} computedResults={computedResults} resultsUnit={study.resultsUnit} />
                </TabPanel>
                <TabPanel value={value} index={2}>
                    <Result studySite={studySite} computedResults={computedResults} resultsUnit={study.resultsUnit} />
                </TabPanel>
            </Box>
        </Container >
    );
}