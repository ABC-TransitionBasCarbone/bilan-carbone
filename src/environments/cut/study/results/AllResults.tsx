'use client';

import SelectStudySite from "@/components/study/site/SelectStudySite";
import useStudySite from "@/components/study/site/useStudySite";
import { EmissionFactorWithParts } from "@/db/emissionFactors";
import { FullStudy } from "@/db/study";
import { Box, Button, Container, Tab, Tabs } from "@mui/material";
import { Export, ExportRule, SubPost } from "@prisma/client";
import { useTranslations } from "next-intl";
import DownloadIcon from '@mui/icons-material/Download';
import { SyntheticEvent, useMemo, useState } from "react";
import Result from "@/components/study/results/Result";
import { computeResultsByPost } from "@/services/results/consolidated";
import { filterWithDependencies } from "@/services/results/utils";
import PieResult from "./PieResult";
import BegesResultsTable from "@/components/study/results/beges/BegesResultsTable";

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

    const { studySite, setSite } = useStudySite(study, true);

    const allComputedResults = useMemo(
        () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
        [studySite, validatedOnly],
    );

    const computedResults = useMemo(
        () =>
            allComputedResults
                .map((post) => ({
                    ...post,
                    subPosts: post.subPosts.filter((subPost) => filterWithDependencies(subPost.post as SubPost, false)),
                }))
                .map((post) => ({ ...post, value: post.subPosts.reduce((res, subPost) => res + subPost.value, 0) })),
        [allComputedResults],
    );

    const begesRules = useMemo(() => rules.filter((rule) => rule.export === Export.Beges), [rules]);

    return (
        <Container>
            <Box component="section" sx={{ display: 'flex', gap: '1rem' }}>
                <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
                <Button variant="outlined" size="large" endIcon={<DownloadIcon />}>exporter mon Bilan Carbone</Button>
            </Box>
            <Box
                component="section"
                sx={{ marginTop: '1rem' }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="secondary"
                    textColor="inherit"
                    variant="fullWidth"
                >
                    <Tab label="Tableau" {...a11yProps(0)} />
                    <Tab label="Diagramme en barres" {...a11yProps(1)} />
                    <Tab label="Diagramme circulaire" {...a11yProps(2)} />
                </Tabs>
                <Box component="section" sx={{ marginTop: '1rem' }}>
                    <TabPanel value={value} index={0}>
                        <BegesResultsTable
                            study={study}
                            rules={begesRules}
                            emissionFactorsWithParts={emissionFactorsWithParts}
                            studySite={studySite}
                            withDependencies={false}
                        />
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <PieResult studySite={studySite} computedResults={computedResults} resultsUnit={study.resultsUnit} />
                    </TabPanel>
                    <TabPanel value={value} index={2}>
                        <Result studySite={studySite} computedResults={computedResults} resultsUnit={study.resultsUnit} />
                    </TabPanel>
                </Box>
            </Box>
        </Container >
    );
}