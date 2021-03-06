import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import TextComplement from '../components/TextComplement';
import TextHeading from '../components/TextHeading';
import colors from '../styles/colors';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import EnvironmentButton from '../components/EnvironmentButton';
import { FlatList } from 'react-native-gesture-handler';
import api from '../services/api';
import PlantCardPrimary from '../components/PlantCardPrimary';
import Load from '../components/Load';
import { useNavigation } from '@react-navigation/core';
import { PlantProps } from '../libs/storage';

interface PlantSelectProps {}

interface EnvironmentProps {
  key: string;
  title: string;
}

const PlantSelect = (props: PlantSelectProps) => {
  const navigation = useNavigation();
  const [environments, setEnvironments] = useState<EnvironmentProps[]>([]);
  const [plants, setPlants] = useState<PlantProps[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<PlantProps[]>([]);
  const [environmentSelected, setEnvironmentSelected] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const handleEnvironmentSelected = (environment: string) => {
    setEnvironmentSelected(environment);

    if (environment === 'all') return setFilteredPlants(plants);

    const filtered = plants.filter((plant) =>
      plant.environments.includes(environment)
    );

    setFilteredPlants(filtered);
  };

  async function fetchPlants() {
    const { data } = await api.get(
      `plants?_sort=name&_order=asc&_page=${page}&_limit=8`
    );

    if (!data) return setLoading(true);

    if (page > 1) {
      setPlants((plants) => [...plants, ...data]);
      setFilteredPlants((plants) => [...plants, ...data]);
    } else {
      setPlants(data);
      setFilteredPlants(data);
    }

    setLoading(false);
    setLoadingMore(false);
  }

  function handleFetchMore(distance: number) {
    if (distance < 1) return;

    setLoadingMore(true);
    setPage((page) => page + 1);
    fetchPlants();
  }

  function handlePlantSelect(plant: PlantProps) {
    navigation.navigate('PlantSave', { plant });
  }

  useEffect(() => {
    async function fetchEnvironment() {
      const { data } = await api.get(
        'plants_environments?_sort=title&_order=asc'
      );
      setEnvironments([{ key: 'all', title: 'All' }, ...data]);
    }
    fetchEnvironment();
  }, []);

  useEffect(() => {
    fetchPlants();
  }, []);

  if (loading) return <Load />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Header style={styles.header} />
        <TextHeading>In which environment </TextHeading>
        <TextComplement>do you want to place your plant?</TextComplement>
      </View>
      <View>
        <FlatList
          data={environments}
          keyExtractor={(item) => String(item.key)}
          renderItem={({ item }) => (
            <EnvironmentButton
              title={item.title}
              style={styles.envButton}
              active={item.key === environmentSelected}
              onPress={() => handleEnvironmentSelected(item.key)}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.envList}
        />
      </View>
      <View style={styles.plants}>
        <FlatList
          data={filteredPlants}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PlantCardPrimary
              data={item}
              onPress={() => handlePlantSelect(item)}
            />
          )}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.1}
          onEndReached={({ distanceFromEnd }) =>
            handleFetchMore(distanceFromEnd)
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.green} /> : <></>
          }
        />
      </View>
    </View>
  );
};

export default PlantSelect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 40,
  },
  envButton: {
    marginHorizontal: 2,
  },
  envList: {
    height: 40,
    paddingHorizontal: 40,
    justifyContent: 'center',
    paddingBottom: 5,
    marginVertical: 32,
  },
  content: {
    marginTop: getStatusBarHeight(),
    paddingHorizontal: 40,
  },
  plants: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
});
